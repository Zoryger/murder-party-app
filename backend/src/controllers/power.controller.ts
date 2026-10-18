import { Request, Response } from "express";
import { Op } from "sequelize";
import {
  Game,
  GamePlayer,
  ScenarioCharacter,
  ScenarioRelation,
  Power,
  Conversation,
  Message,
  PowerUse,
  GameClue,
} from "../models/sequelize";

async function getMyActivePlayer(gameId: number, userId: number) {
  const game = await Game.findByPk(gameId);
  if (!game || game.status !== "active")
    return { error: "La partie n'est pas en cours." };

  const player = await GamePlayer.findOne({ where: { gameId, userId } });
  if (!player) return { error: "Vous n'êtes pas dans cette partie." };
  if (player.status !== "alive")
    return { error: "Les fantômes ne peuvent plus utiliser leur pouvoir." };
  if (!player.scenarioCharacterId)
    return { error: "Aucun personnage assigné." };

  return { game, player };
}

async function getUsesRemaining(
  gamePlayerId: number,
  powerSlug: string,
  maxUses: number,
): Promise<number> {
  if (maxUses === 0) return 0;
  const used = await PowerUse.count({ where: { gamePlayerId, powerSlug } });
  return Math.max(0, maxUses - used);
}

async function requirePower(player: GamePlayer, slug: string) {
  const character = await ScenarioCharacter.findByPk(
    player.scenarioCharacterId!,
  );
  const power = character ? await Power.findByPk(character.powerId) : null;
  if (!power || power.slug !== slug)
    return { error: "Vous ne possédez pas ce pouvoir." };
  const usesRemaining = await getUsesRemaining(
    player.id,
    power.slug,
    power.maxUses,
  );
  if (usesRemaining <= 0) return { error: "Vous avez épuisé ce pouvoir." };
  return { power };
}

// ── GET /api/games/:id/my-power ─────────────────────────────────────────────
export async function getMyPower(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const result = await getMyActivePlayer(gameId, req.user!.userId);
  if ("error" in result) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const { player } = result;

  const character = await ScenarioCharacter.findByPk(
    player.scenarioCharacterId!,
  );
  if (!character) {
    res
      .status(404)
      .json({ success: false, message: "Personnage introuvable." });
    return;
  }
  const power = await Power.findByPk(character.powerId);
  if (!power) {
    res.status(404).json({ success: false, message: "Pouvoir introuvable." });
    return;
  }

  const usesRemaining = await getUsesRemaining(
    player.id,
    power.slug,
    power.maxUses,
  );

  res.json({
    success: true,
    data: {
      slug: power.slug,
      name: power.name,
      category: power.category,
      description: power.description,
      maxUses: power.maxUses,
      durationSeconds: power.durationSeconds,
      usesRemaining,
    },
  });
}

// ── POST /api/games/:id/powers/voyante ──────────────────────────────────────
export async function useVoyante(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const result = await getMyActivePlayer(gameId, req.user!.userId);
  if ("error" in result) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const { player } = result;

  const check = await requirePower(player, "voyante");
  if ("error" in check) {
    res.status(403).json({ success: false, message: check.error });
    return;
  }

  const players = await GamePlayer.findAll({ where: { gameId } });
  const characterIds = players
    .map((p) => p.scenarioCharacterId)
    .filter((id): id is number => id !== null);
  const characters = await ScenarioCharacter.findAll({
    where: { id: characterIds },
    order: [["displayOrder", "ASC"]],
  });
  const powers = await Power.findAll();
  const powerById = new Map(powers.map((p) => [p.id, p]));

  await PowerUse.create({
    gameId,
    gamePlayerId: player.id,
    powerSlug: "voyante",
  });

  res.json({
    success: true,
    data: characters.map((c) => ({
      characterTitle: c.title,
      powerName: powerById.get(c.powerId)?.name ?? "???",
      powerCategory: powerById.get(c.powerId)?.category ?? "???",
    })),
  });
}

// ── POST /api/games/:id/powers/analyseur-relations ─────────────────────────
export async function useAnalyseurRelations(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const result = await getMyActivePlayer(gameId, req.user!.userId);
  if ("error" in result) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const { player } = result;

  const check = await requirePower(player, "analyseur-de-relations");
  if ("error" in check) {
    res.status(403).json({ success: false, message: check.error });
    return;
  }

  const t1 = Number(req.body.targetPlayerId1);
  const t2 = Number(req.body.targetPlayerId2);
  if (!t1 || !t2 || t1 === t2) {
    res
      .status(400)
      .json({
        success: false,
        message: "Sélectionnez deux joueurs différents.",
      });
    return;
  }

  const [p1, p2] = await Promise.all([
    GamePlayer.findOne({ where: { id: t1, gameId } }),
    GamePlayer.findOne({ where: { id: t2, gameId } }),
  ]);
  if (!p1 || !p2 || !p1.scenarioCharacterId || !p2.scenarioCharacterId) {
    res.status(404).json({ success: false, message: "Joueur introuvable." });
    return;
  }

  const relation = await ScenarioRelation.findOne({
    where: {
      [Op.or]: [
        {
          characterId: p1.scenarioCharacterId,
          relatedCharacterId: p2.scenarioCharacterId,
        },
        {
          characterId: p2.scenarioCharacterId,
          relatedCharacterId: p1.scenarioCharacterId,
        },
      ],
    },
  });

  await PowerUse.create({
    gameId,
    gamePlayerId: player.id,
    powerSlug: "analyseur-de-relations",
    targetPlayerId: t1,
    targetPlayerId2: t2,
  });

  res.json({
    success: true,
    data: {
      player1: p1.characterName,
      player2: p2.characterName,
      relationType: relation?.relationType ?? "aucune",
    },
  });
}

// ── POST /api/games/:id/powers/informaticien ────────────────────────────────
export async function useInformaticien(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const result = await getMyActivePlayer(gameId, req.user!.userId);
  if ("error" in result) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const { player } = result;

  const check = await requirePower(player, "informaticien");
  if ("error" in check) {
    res.status(403).json({ success: false, message: check.error });
    return;
  }

  const t1 = Number(req.body.targetPlayerId1);
  const t2 = Number(req.body.targetPlayerId2);
  if (!t1 || !t2 || t1 === t2) {
    res
      .status(400)
      .json({
        success: false,
        message: "Sélectionnez deux joueurs différents.",
      });
    return;
  }
  if (t1 === player.id || t2 === player.id) {
    res
      .status(400)
      .json({ success: false, message: "Choisissez deux AUTRES joueurs." });
    return;
  }

  const [p1, p2] = await Promise.all([
    GamePlayer.findOne({ where: { id: t1, gameId } }),
    GamePlayer.findOne({ where: { id: t2, gameId } }),
  ]);
  if (!p1 || !p2) {
    res.status(404).json({ success: false, message: "Joueur introuvable." });
    return;
  }

  let conversation = await Conversation.findOne({
    where: {
      gameId,
      [Op.or]: [
        { player1Id: t1, player2Id: t2 },
        { player1Id: t2, player2Id: t1 },
      ],
    },
  });
  if (!conversation) {
    conversation = await Conversation.create({
      gameId,
      player1Id: t1,
      player2Id: t2,
      isFake: false,
    });
  }

  await PowerUse.create({
    gameId,
    gamePlayerId: player.id,
    powerSlug: "informaticien",
    targetPlayerId: t1,
    targetPlayerId2: t2,
    conversationId: conversation.id,
  });

  res.json({
    success: true,
    message: `Accès permanent accordé à la conversation entre ${p1.characterName} et ${p2.characterName}.`,
    data: { conversationId: conversation.id },
  });
}

// ── POST /api/games/:id/powers/falsificateur ────────────────────────────────
export async function useFalsificateur(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const result = await getMyActivePlayer(gameId, req.user!.userId);
  if ("error" in result) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const { player } = result;

  const check = await requirePower(player, "falsificateur");
  if ("error" in check) {
    res.status(403).json({ success: false, message: check.error });
    return;
  }

  const clueId = Number(req.body.clueId);
  const newGamePlayerId = Number(req.body.newGamePlayerId);

  const clue = await GameClue.findOne({ where: { id: clueId, gameId } });
  if (!clue) {
    res.status(404).json({ success: false, message: "Indice introuvable." });
    return;
  }

  const newTargetPlayer = await GamePlayer.findOne({
    where: { id: newGamePlayerId, gameId },
  });
  if (!newTargetPlayer || !newTargetPlayer.scenarioCharacterId) {
    res.status(400).json({ success: false, message: "Joueur cible invalide." });
    return;
  }

  clue.currentCharacterId = newTargetPlayer.scenarioCharacterId;
  clue.isFalsified = true;
  clue.falsifiedByPlayerId = player.id;
  await clue.save();

  await PowerUse.create({
    gameId,
    gamePlayerId: player.id,
    powerSlug: "falsificateur",
    targetPlayerId: newGamePlayerId,
    payload: String(clueId),
  });

  res.json({
    success: true,
    message: `Indice réattribué à ${newTargetPlayer.characterName}.`,
  });
}

// ── POST /api/games/:id/powers/usurpateur ───────────────────────────────────
export async function useUsurpateur(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const result = await getMyActivePlayer(gameId, req.user!.userId);
  if ("error" in result) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const { player } = result;

  const check = await requirePower(player, "usurpateur");
  if ("error" in check) {
    res.status(403).json({ success: false, message: check.error });
    return;
  }

  const t1 = Number(req.body.targetPlayerId1);
  const t2 = Number(req.body.targetPlayerId2);
  const fakeSenderId = Number(req.body.fakeSenderId);
  const content = String(req.body.content ?? "").trim();

  if (!t1 || !t2 || t1 === t2) {
    res
      .status(400)
      .json({
        success: false,
        message: "Sélectionnez deux joueurs différents.",
      });
    return;
  }
  if (t1 === player.id || t2 === player.id) {
    res
      .status(400)
      .json({ success: false, message: "Choisissez deux AUTRES joueurs." });
    return;
  }
  if (fakeSenderId !== t1 && fakeSenderId !== t2) {
    res
      .status(400)
      .json({
        success: false,
        message:
          "L'auteur du faux message doit être l'un des deux joueurs choisis.",
      });
    return;
  }
  if (!content) {
    res
      .status(400)
      .json({ success: false, message: "Le message ne peut pas être vide." });
    return;
  }

  const [p1, p2] = await Promise.all([
    GamePlayer.findOne({ where: { id: t1, gameId } }),
    GamePlayer.findOne({ where: { id: t2, gameId } }),
  ]);
  if (!p1 || !p2) {
    res.status(404).json({ success: false, message: "Joueur introuvable." });
    return;
  }

  const conversation = await Conversation.create({
    gameId,
    player1Id: t1,
    player2Id: t2,
    isFake: true,
    createdBy: player.id,
  });
  await Message.create({
    conversationId: conversation.id,
    senderId: fakeSenderId,
    content,
  });

  await PowerUse.create({
    gameId,
    gamePlayerId: player.id,
    powerSlug: "usurpateur",
    targetPlayerId: t1,
    targetPlayerId2: t2,
    conversationId: conversation.id,
  });

  res.status(201).json({
    success: true,
    message: `Fausse conversation créée entre ${p1.characterName} et ${p2.characterName}.`,
    data: { conversationId: conversation.id },
  });
}

// ── POST /api/games/:id/powers/vision-absolue ───────────────────────────────
export async function useVisionAbsolue(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const result = await getMyActivePlayer(gameId, req.user!.userId);
  if ("error" in result) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const { player } = result;

  const check = await requirePower(player, "vision-absolue");
  if ("error" in check) {
    res.status(403).json({ success: false, message: check.error });
    return;
  }

  const use = await PowerUse.create({
    gameId,
    gamePlayerId: player.id,
    powerSlug: "vision-absolue",
  });
  const expiresAt = new Date(
    use.createdAt.getTime() + (check.power.durationSeconds ?? 60) * 1000,
  );

  res.json({ success: true, data: { activatedAt: use.createdAt, expiresAt } });
}
