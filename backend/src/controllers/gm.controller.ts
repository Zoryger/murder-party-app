import { Request, Response } from "express";
import {
  sequelize,
  Game,
  GamePlayer,
  User,
  Power,
  ScenarioCharacter,
  ScenarioPhysicalClue,
  ScenarioCluePassword,
  ScenarioQrClue,
  AlchemistRequest,
} from "../models/sequelize";
import { getIO } from "../sockets";

// Renvoie la partie si l'utilisateur en est le MJ, sinon répond 403/404 et renvoie null
async function loadGmGame(req: Request, res: Response): Promise<Game | null> {
  const game = await Game.findByPk(Number(req.params["id"]));
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return null;
  }
  if (game.createdBy !== req.user!.userId) {
    res
      .status(403)
      .json({ success: false, message: "Réservé au Maître du Jeu." });
    return null;
  }
  return game;
}

// ── GET /api/games/:id/gm/overview ───────────────────────────────────────────
export async function getGmOverview(
  req: Request,
  res: Response,
): Promise<void> {
  const game = await loadGmGame(req, res);
  if (!game) return;

  const players = await GamePlayer.findAll({
    where: { gameId: game.id },
    order: [["createdAt", "ASC"]],
  });

  const userIds = players
    .map((p) => p.userId)
    .filter((id): id is number => id !== null);
  const users = await User.findAll({ where: { id: userIds } });
  const usernameById = new Map(users.map((u) => [u.id, u.username]));

  const characterIds = players
    .map((p) => p.scenarioCharacterId)
    .filter((id): id is number => id !== null);
  const characters = await ScenarioCharacter.findAll({
    where: { id: characterIds },
  });
  const powers = await Power.findAll();
  const powerByCharacterId = new Map(
    characters.map((c) => [c.id, powers.find((p) => p.id === c.powerId)]),
  );

  const qrClues = game.scenarioId
    ? await ScenarioQrClue.findAll({ where: { scenarioId: game.scenarioId } })
    : [];
  const physicalClues = game.scenarioId
    ? await ScenarioPhysicalClue.findAll({
        where: { scenarioId: game.scenarioId },
        attributes: ["id", "name"],
      })
    : [];
  const cluePasswords = physicalClues.length
    ? await ScenarioCluePassword.findAll({
        where: { physicalClueId: physicalClues.map((clue) => clue.id) },
      })
    : [];
  const passwordByClueId = new Map(
    cluePasswords.map((entry) => [entry.physicalClueId, entry.password]),
  );
  const qrCluePasswords = qrClues.length
    ? await ScenarioCluePassword.findAll({
        where: { qrClueId: qrClues.map((clue) => clue.id) },
      })
    : [];
  const passwordByQrClueId = new Map(
    qrCluePasswords.map((entry) => [entry.qrClueId, entry.password]),
  );

  const pendingAlchemistCount = await AlchemistRequest.count({
    where: { gameId: game.id, status: "pending" },
  });

  res.json({
    success: true,
    data: {
      game: { id: game.id, name: game.name, status: game.status },
      players: players.map((p) => ({
        id: p.id,
        username: p.userId ? (usernameById.get(p.userId) ?? null) : null,
        characterName: p.characterName,
        characterTitle: p.characterRole,
        powerName:
          (p.scenarioCharacterId &&
            powerByCharacterId.get(p.scenarioCharacterId)?.name) ||
          "—",
        status: p.status,
        money: p.money,
        isMurderer: p.isMurderer,
        messagingCode: p.messagingCode,
      })),
      qrClues: qrClues.map((q) => ({ slug: q.slug, title: q.title })),
      cluePasswords: [
        ...physicalClues.map((clue) => {
          const password = passwordByClueId.get(clue.id);
          if (!password) {
            throw new Error(`Mot de passe manquant pour l'indice ${clue.id}.`);
          }
          return { name: clue.name, password };
        }),
        ...qrClues.map((clue) => {
          const password = passwordByQrClueId.get(clue.id);
          if (!password) {
            throw new Error(`Mot de passe manquant pour l'indice QR ${clue.id}.`);
          }
          return { name: clue.title, password };
        }),
      ],
      pendingAlchemistCount,
    },
  });
}

// ── GET /api/games/:id/gm/alchemist ──────────────────────────────────────────
export async function getGmAlchemistRequests(
  req: Request,
  res: Response,
): Promise<void> {
  const game = await loadGmGame(req, res);
  if (!game) return;

  const rows = await AlchemistRequest.findAll({ where: { gameId: game.id } });
  const players = await GamePlayer.findAll({ where: { gameId: game.id } });

  const userIds = players
    .map((p) => p.userId)
    .filter((id): id is number => id !== null);
  const users = await User.findAll({ where: { id: userIds } });
  const usernameById = new Map(users.map((u) => [u.id, u.username]));
  const playerById = new Map(players.map((p) => [p.id, p]));

  // En attente d'abord (la plus ancienne en premier), puis l'historique (le plus récent en premier)
  rows.sort((a, b) => {
    const aPending = a.status === "pending";
    const bPending = b.status === "pending";
    if (aPending !== bPending) return aPending ? -1 : 1;
    const diff =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return aPending ? diff : -diff;
  });

  res.json({
    success: true,
    data: rows.map((r) => {
      const p = playerById.get(r.playerId);
      return {
        id: r.id,
        playerName: p?.characterName ?? "???",
        username: p?.userId ? (usernameById.get(p.userId) ?? null) : null,
        question: r.question,
        cost: r.cost,
        status: r.status,
        answer: r.answer,
        createdAt: r.createdAt,
        answeredAt: r.answeredAt,
      };
    }),
  });
}

// ── POST /api/games/:id/gm/alchemist/:requestId/answer ───────────────────────
// body : { "answer": "yes" | "no" | "refuse" }  — "refuse" rembourse le joueur
export async function answerAlchemistRequest(
  req: Request,
  res: Response,
): Promise<void> {
  const game = await loadGmGame(req, res);
  if (!game) return;

  const requestId = Number(req.params["requestId"]);
  const answer = String(req.body.answer ?? "");
  if (!["yes", "no", "refuse"].includes(answer)) {
    res
      .status(400)
      .json({
        success: false,
        message: "Réponse attendue : yes, no ou refuse.",
      });
    return;
  }

  const request = await AlchemistRequest.findOne({
    where: { id: requestId, gameId: game.id },
  });
  if (!request) {
    res.status(404).json({ success: false, message: "Question introuvable." });
    return;
  }
  if (request.status !== "pending") {
    res
      .status(400)
      .json({ success: false, message: "Cette question a déjà été traitée." });
    return;
  }

  const io = getIO();

  if (answer === "refuse") {
    // Statut et remboursement dans la même transaction ; seul l'appel qui "prend" la question rembourse
    const refunded = await sequelize.transaction(async (t) => {
      const [claimed] = await AlchemistRequest.update(
        { status: "refused", answeredAt: new Date() },
        { where: { id: request.id, status: "pending" }, transaction: t },
      );
      if (claimed !== 1) return false;
      await GamePlayer.increment("money", {
        by: request.cost,
        where: { id: request.playerId },
        transaction: t,
      });
      return true;
    });

    if (!refunded) {
      res
        .status(400)
        .json({
          success: false,
          message: "Cette question a déjà été traitée.",
        });
      return;
    }

    io.to(`game:${game.id}`).emit("money:update");
    io.to(`game:${game.id}`).emit("alchemist:update");
    res.json({
      success: true,
      message: `Question refusée : ${request.cost} G remboursés.`,
    });
    return;
  }

  const [claimed] = await AlchemistRequest.update(
    {
      status: "answered",
      answer: answer as "yes" | "no",
      answeredAt: new Date(),
    },
    { where: { id: request.id, status: "pending" } },
  );
  if (claimed !== 1) {
    res
      .status(400)
      .json({ success: false, message: "Cette question a déjà été traitée." });
    return;
  }

  io.to(`game:${game.id}`).emit("alchemist:update");
  res.json({
    success: true,
    message: `Réponse envoyée : ${answer === "yes" ? "OUI" : "NON"}.`,
  });
}
