import { Request, Response } from "express";
import { Op } from "sequelize";
import {
  sequelize,
  Game,
  GamePlayer,
  User,
  ScenarioCharacter,
  LoveBond,
  Duel,
  TimedEffect,
  FinalSubmission,
  FinalAccusation,
} from "../models/sequelize";
import { buildResults } from "../utils/results.util";
import { MURDERERS_COUNT } from "../config/game.rules";
import { getIO } from "../sockets";

function notifyPhase(gameId: number, status: string): void {
  getIO().to(`game:${gameId}`).emit("game:phase", { status });
}

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

// ── GET /api/games/:id/phase ─────────────────────────────────────────────────
// Étape de la partie — sert à aiguiller chaque joueur vers la bonne page.
export async function getPhase(req: Request, res: Response): Promise<void> {
  const game = await Game.findByPk(Number(req.params["id"]));
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }

  const isGm = game.createdBy === req.user!.userId;
  if (!isGm) {
    const me = await GamePlayer.findOne({
      where: { gameId: game.id, userId: req.user!.userId },
    });
    if (!me) {
      res
        .status(403)
        .json({
          success: false,
          message: "Vous n'êtes pas dans cette partie.",
        });
      return;
    }
  }

  res.json({ success: true, data: { status: game.status, isGm } });
}

// ═══════════════════════════════════════════════════════════════════════════
//  JOUEURS — formulaire final
// ═══════════════════════════════════════════════════════════════════════════

// ── GET /api/games/:id/final ─────────────────────────────────────────────────
export async function getFinalForm(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }

  const me = await GamePlayer.findOne({
    where: { gameId, userId: req.user!.userId },
  });
  if (!me) {
    res
      .status(403)
      .json({
        success: false,
        message: "Le formulaire est réservé aux joueurs.",
      });
    return;
  }

  if (game.status !== "voting" && game.status !== "finished") {
    res
      .status(400)
      .json({ success: false, message: "Le vote final n'est pas ouvert." });
    return;
  }

  const players = await GamePlayer.findAll({
    where: { gameId },
    order: [["createdAt", "ASC"]],
  });
  const submission = await FinalSubmission.findOne({
    where: { gameId, playerId: me.id },
  });
  const accusations = submission
    ? await FinalAccusation.findAll({ where: { submissionId: submission.id } })
    : [];

  // Rappel de l'objectif : le lien de Cupidon remplace l'objectif d'origine
  const character = me.scenarioCharacterId
    ? await ScenarioCharacter.findByPk(me.scenarioCharacterId)
    : null;
  const bond = await LoveBond.findOne({
    where: { gameId, [Op.or]: [{ player1Id: me.id }, { player2Id: me.id }] },
  });
  const partner = bond
    ? players.find(
        (p) =>
          p.id === (bond.player1Id === me.id ? bond.player2Id : bond.player1Id),
      )
    : null;

  res.json({
    success: true,
    data: {
      status: game.status,
      readOnly: game.status === "finished",
      required: MURDERERS_COUNT,
      myPlayerId: me.id,
      players: players.map((p) => ({
        id: p.id,
        characterName: p.characterName,
      })),
      objective: partner
        ? `Survivre et être innocenté(e) avec ${partner.characterName}`
        : (character?.objective ?? ""),
      mine: submission
        ? {
            accusations: accusations.map((a) => ({
              playerId: a.accusedPlayerId,
              mobile: a.mobile,
            })),
            weapon: submission.weapon,
            subplots: submission.subplots,
            objectiveNotes: submission.objectiveNotes,
            submittedAt: submission.updatedAt,
          }
        : null,
    },
  });
}

// ── POST /api/games/:id/final ────────────────────────────────────────────────
// body : { accusations: [{ playerId, mobile } × 3], weapon, subplots, objectiveNotes }
export async function submitFinal(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }
  if (game.status !== "voting") {
    res
      .status(400)
      .json({ success: false, message: "Le vote final n'est pas ouvert." });
    return;
  }

  const me = await GamePlayer.findOne({
    where: { gameId, userId: req.user!.userId },
  });
  if (!me) {
    res
      .status(403)
      .json({
        success: false,
        message: "Le formulaire est réservé aux joueurs.",
      });
    return;
  }

  const raw = req.body.accusations;
  if (!Array.isArray(raw) || raw.length !== MURDERERS_COUNT) {
    res
      .status(400)
      .json({
        success: false,
        message: `Désignez exactement ${MURDERERS_COUNT} meurtriers.`,
      });
    return;
  }

  const accusations = raw.map(
    (a: { playerId?: unknown; mobile?: unknown }) => ({
      playerId: Number(a.playerId),
      mobile: String(a.mobile ?? "").trim(),
    }),
  );

  if (new Set(accusations.map((a) => a.playerId)).size !== MURDERERS_COUNT) {
    res
      .status(400)
      .json({
        success: false,
        message: "Désignez trois personnes différentes.",
      });
    return;
  }

  const gamePlayers = await GamePlayer.findAll({ where: { gameId } });
  const validIds = new Set(gamePlayers.map((p) => p.id));
  if (accusations.some((a) => !validIds.has(a.playerId))) {
    res
      .status(400)
      .json({
        success: false,
        message: "Une des personnes désignées est introuvable.",
      });
    return;
  }
  if (accusations.some((a) => a.mobile.length < 2 || a.mobile.length > 1000)) {
    res
      .status(400)
      .json({
        success: false,
        message:
          "Indiquez un mobile (1000 caractères max) pour chaque personne désignée.",
      });
    return;
  }

  const weapon = String(req.body.weapon ?? "").trim();
  const subplots = String(req.body.subplots ?? "")
    .trim()
    .slice(0, 3000);
  const objectiveNotes = String(req.body.objectiveNotes ?? "")
    .trim()
    .slice(0, 2000);
  if (weapon.length < 5 || weapon.length > 2000) {
    res
      .status(400)
      .json({
        success: false,
        message: "Décrivez l'arme et le mode opératoire (5 à 2000 caractères).",
      });
    return;
  }

  // Création ou mise à jour : le joueur peut corriger sa réponse jusqu'à la révélation
  await sequelize.transaction(async (t) => {
    const [submission] = await FinalSubmission.findOrCreate({
      where: { gameId, playerId: me.id },
      defaults: { gameId, playerId: me.id, weapon, subplots, objectiveNotes },
      transaction: t,
    });
    await submission.update(
      { weapon, subplots, objectiveNotes },
      { transaction: t },
    );

    await FinalAccusation.destroy({
      where: { submissionId: submission.id },
      transaction: t,
    });
    await FinalAccusation.bulkCreate(
      accusations.map((a) => ({
        submissionId: submission.id,
        accusedPlayerId: a.playerId,
        mobile: a.mobile,
      })),
      { transaction: t },
    );
  });

  getIO().to(`game:${gameId}`).emit("final:update");

  res.json({
    success: true,
    message:
      "Réponse enregistrée. Tu peux la modifier jusqu'à la révélation du MJ.",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  MJ — clôture, reprise, révélation
// ═══════════════════════════════════════════════════════════════════════════

// ── GET /api/games/:id/gm/final-status ───────────────────────────────────────
export async function getFinalStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const game = await loadGmGame(req, res);
  if (!game) return;

  const players = await GamePlayer.findAll({
    where: { gameId: game.id },
    order: [["createdAt", "ASC"]],
  });
  const submissions = await FinalSubmission.findAll({
    where: { gameId: game.id },
  });
  const submittedIds = new Set(submissions.map((s) => s.playerId));

  const userIds = players
    .map((p) => p.userId)
    .filter((id): id is number => id !== null);
  const users = await User.findAll({ where: { id: userIds } });
  const usernameById = new Map(users.map((u) => [u.id, u.username]));

  res.json({
    success: true,
    data: {
      status: game.status,
      startedAt: game.startedAt,
      totalPlayers: players.length,
      submittedCount: submissions.length,
      players: players.map((p) => ({
        id: p.id,
        characterName: p.characterName,
        username: p.userId ? (usernameById.get(p.userId) ?? null) : null,
        submitted: submittedIds.has(p.id),
      })),
    },
  });
}

// ── POST /api/games/:id/gm/close ─────────────────────────────────────────────
// Fin des 4 heures : le jeu se gèle et le formulaire s'ouvre.
export async function closeGame(req: Request, res: Response): Promise<void> {
  const game = await loadGmGame(req, res);
  if (!game) return;

  if (game.status !== "active") {
    res
      .status(400)
      .json({
        success: false,
        message: "Seule une partie en cours peut être clôturée.",
      });
    return;
  }

  // Plus de duel ni d'effet en cours : un duel ne doit pas tuer quelqu'un pendant le vote
  await Duel.update(
    { status: "cancelled" },
    { where: { gameId: game.id, status: { [Op.in]: ["joust", "voting"] } } },
  );
  await TimedEffect.update(
    { cancelledAt: new Date() },
    {
      where: {
        gameId: game.id,
        cancelledAt: null,
        endsAt: { [Op.gt]: new Date() },
      },
    },
  );

  game.status = "voting";
  await game.save();

  const io = getIO();
  io.to(`game:${game.id}`).emit("event:update");
  notifyPhase(game.id, "voting");

  res.json({
    success: true,
    message: "Partie clôturée : le vote final est ouvert.",
  });
}

// ── POST /api/games/:id/gm/reopen ────────────────────────────────────────────
// Filet de sécurité : le MJ a clôturé trop tôt. Les réponses déjà rendues sont conservées.
export async function reopenGame(req: Request, res: Response): Promise<void> {
  const game = await loadGmGame(req, res);
  if (!game) return;

  if (game.status !== "voting") {
    res
      .status(400)
      .json({
        success: false,
        message: "Seule une partie en vote final peut être reprise.",
      });
    return;
  }

  game.status = "active";
  await game.save();
  notifyPhase(game.id, "active");

  res.json({ success: true, message: "La partie reprend." });
}

// ── POST /api/games/:id/gm/reveal ────────────────────────────────────────────
export async function revealGame(req: Request, res: Response): Promise<void> {
  const game = await loadGmGame(req, res);
  if (!game) return;

  if (game.status !== "voting") {
    res
      .status(400)
      .json({
        success: false,
        message: "Le vote final doit être ouvert pour révéler la solution.",
      });
    return;
  }

  game.status = "finished";
  game.finishedAt = new Date();
  await game.save();
  notifyPhase(game.id, "finished");

  res.json({ success: true, message: "Solution révélée." });
}

// ═══════════════════════════════════════════════════════════════════════════
//  RÉSULTATS
// ═══════════════════════════════════════════════════════════════════════════

// ── GET /api/games/:id/results ───────────────────────────────────────────────
// Joueurs : une fois la solution révélée. MJ : aussi en aperçu pendant le vote.
export async function getResults(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }

  const isGm = game.createdBy === userId;
  let me: GamePlayer | null = null;
  if (!isGm) {
    me = await GamePlayer.findOne({ where: { gameId, userId } });
    if (!me) {
      res
        .status(403)
        .json({
          success: false,
          message: "Vous n'êtes pas dans cette partie.",
        });
      return;
    }
  }

  const canSee =
    game.status === "finished" || (game.status === "voting" && isGm);
  if (!canSee) {
    res.status(403).json({
      success: false,
      message:
        game.status === "voting"
          ? "Les résultats seront révélés par le MJ."
          : "La partie n'est pas terminée.",
    });
    return;
  }

  const results = await buildResults(game);
  const myAnswer = me
    ? (results.answers.find((a) => a.playerId === me!.id) ?? null)
    : null;

  res.json({
    success: true,
    data: {
      status: game.status,
      isGm,
      submittedCount: results.submittedCount,
      totalPlayers: results.totalPlayers,
      solution: results.solution,
      tally: results.tally,
      verdicts: results.verdicts,
      myAnswer,
      // Les réponses libres des autres ne sont visibles que du MJ
      answers: isGm ? results.answers : null,
    },
  });
}
