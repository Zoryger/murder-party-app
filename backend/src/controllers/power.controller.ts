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
  GhostSubstitution,
  LoveBond,
} from "../models/sequelize";
import {
  resolvePowerAccess,
  getUsesRemaining,
  getPowerOfPlayer,
  computeAvailability,
} from "../utils/power.util";
import type { PowerAccessError } from "../utils/power.util";
import {
  makeGhost,
  revivePlayer,
  notifyStatusChange,
} from "../utils/status.util";
import { getIO } from "../sockets";

function denied(res: Response, access: PowerAccessError): void {
  res.status(access.status).json({ success: false, message: access.error });
}

function powerInfo(
  power: Power,
  usesRemaining: number,
  status: "alive" | "ghost",
) {
  const { canUse, lockedReason } = computeAvailability(
    status,
    power.slug,
    power.maxUses,
    usesRemaining,
  );
  return {
    slug: power.slug,
    name: power.name,
    category: power.category,
    description: power.description,
    maxUses: power.maxUses,
    durationSeconds: power.durationSeconds,
    usesRemaining,
    canUse,
    lockedReason,
  };
}

// ── GET /api/games/:id/my-power ─────────────────────────────────────────────
export async function getMyPower(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);

  const game = await Game.findByPk(gameId);
  if (!game || game.status !== "active") {
    res
      .status(400)
      .json({ success: false, message: "La partie n'est pas en cours." });
    return;
  }

  const actor = await GamePlayer.findOne({
    where: { gameId, userId: req.user!.userId },
  });
  if (!actor) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }
  if (!actor.scenarioCharacterId) {
    res
      .status(400)
      .json({ success: false, message: "Aucun personnage assigné." });
    return;
  }

  const ownPower = await getPowerOfPlayer(actor);
  if (!ownPower) {
    res.status(404).json({ success: false, message: "Pouvoir introuvable." });
    return;
  }

  const ownRemaining = await getUsesRemaining(
    actor.id,
    ownPower.slug,
    ownPower.maxUses,
  );

  let borrowed:
    | (ReturnType<typeof powerInfo> & { fromCharacterName: string })
    | null = null;
  if (actor.status === "alive") {
    const substitution = await GhostSubstitution.findOne({
      where: { gameId, holderPlayerId: actor.id, isActive: true },
    });
    if (substitution) {
      const substitute = await GamePlayer.findByPk(
        substitution.substitutePlayerId,
      );
      if (substitute && substitute.status === "ghost") {
        const borrowedPower = await getPowerOfPlayer(substitute);
        if (borrowedPower) {
          const remaining = await getUsesRemaining(
            substitute.id,
            borrowedPower.slug,
            borrowedPower.maxUses,
          );
          borrowed = {
            ...powerInfo(borrowedPower, remaining, "alive"),
            fromCharacterName: substitute.characterName,
          };
        }
      }
    }
  }

  res.json({
    success: true,
    data: {
      status: actor.status,
      own: powerInfo(ownPower, ownRemaining, actor.status),
      borrowed,
    },
  });
}

// ── POST /api/games/:id/powers/voyante ──────────────────────────────────────
export async function useVoyante(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const access = await resolvePowerAccess(gameId, req.user!.userId, "voyante");
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner } = access;

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
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
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
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "analyseur-de-relations",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner } = access;

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
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
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
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "informaticien",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner } = access;

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
  if (t1 === actor.id || t2 === actor.id) {
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
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
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
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "falsificateur",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner } = access;

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
  clue.falsifiedByPlayerId = actor.id;
  await clue.save();

  await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
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
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "usurpateur",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner } = access;

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
  if (t1 === actor.id || t2 === actor.id) {
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
    createdBy: actor.id,
  });
  await Message.create({
    conversationId: conversation.id,
    senderId: fakeSenderId,
    content,
  });

  await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
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
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "vision-absolue",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner, power } = access;

  const use = await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
    powerSlug: "vision-absolue",
  });
  const expiresAt = new Date(
    use.createdAt.getTime() + (power.durationSeconds ?? 60) * 1000,
  );

  res.json({ success: true, data: { activatedAt: use.createdAt, expiresAt } });
}

// ═══════════════════════════════════════════════════════════════════════════
//  NOUVEAUX POUVOIRS — Phase 5.5
// ═══════════════════════════════════════════════════════════════════════════

// ── POST /api/games/:id/powers/chasseur-de-primes ──────────────────────────
export async function useChasseurDePrimes(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "chasseur-de-primes",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner } = access;

  const code = String(req.body.code ?? "").trim();
  if (!code) {
    res.status(400).json({ success: false, message: "Code requis." });
    return;
  }

  // Code invalide : on s'arrête AVANT de consommer une utilisation
  const target = await GamePlayer.findOne({
    where: { gameId, messagingCode: code },
  });
  if (!target) {
    res.status(404).json({ success: false, message: "Code invalide." });
    return;
  }
  if (target.id === actor.id) {
    res
      .status(400)
      .json({
        success: false,
        message: "Vous ne pouvez pas vous cibler vous-même.",
      });
    return;
  }
  if (target.status !== "alive") {
    res
      .status(400)
      .json({
        success: false,
        message: `${target.characterName} est déjà un fantôme.`,
      });
    return;
  }

  await makeGhost(gameId, target.id);
  await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
    powerSlug: "chasseur-de-primes",
    targetPlayerId: target.id,
  });
  notifyStatusChange(gameId);

  res.json({
    success: true,
    message: `${target.characterName} est devenu un fantôme.`,
    data: { characterName: target.characterName },
  });
}

// ── POST /api/games/:id/powers/necromancien ────────────────────────────────
export async function useNecromancien(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "necromancien",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner } = access;

  const code = String(req.body.code ?? "").trim();
  if (!code) {
    res.status(400).json({ success: false, message: "Code requis." });
    return;
  }

  const target = await GamePlayer.findOne({
    where: { gameId, messagingCode: code },
  });
  if (!target) {
    res.status(404).json({ success: false, message: "Code invalide." });
    return;
  }
  if (target.status !== "ghost") {
    res
      .status(400)
      .json({
        success: false,
        message: `${target.characterName} n'est pas un fantôme.`,
      });
    return;
  }

  // revivePlayer coupe aussi l'éventuel lien Horcruxe dont ce joueur était le remplaçant
  await revivePlayer(gameId, target.id);
  await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
    powerSlug: "necromancien",
    targetPlayerId: target.id,
  });
  notifyStatusChange(gameId);

  res.json({
    success: true,
    message: `${target.characterName} est revenu parmi les vivants.`,
    data: { characterName: target.characterName },
  });
}

// ── POST /api/games/:id/powers/horcruxe ────────────────────────────────────
export async function useHorcruxe(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  // allowGhost : c'est le seul pouvoir utilisable en étant fantôme
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "horcruxe",
    { allowGhost: true },
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner } = access;

  if (actor.status !== "ghost") {
    res
      .status(400)
      .json({
        success: false,
        message: "L'Horcruxe ne s'active que lorsque vous êtes un fantôme.",
      });
    return;
  }

  const substituteId = Number(req.body.substitutePlayerId);
  if (!substituteId || substituteId === actor.id) {
    res
      .status(400)
      .json({ success: false, message: "Choisissez un autre joueur." });
    return;
  }

  const substitute = await GamePlayer.findOne({
    where: { id: substituteId, gameId },
  });
  if (!substitute || !substitute.scenarioCharacterId) {
    res.status(404).json({ success: false, message: "Joueur introuvable." });
    return;
  }
  if (substitute.status !== "alive") {
    res
      .status(400)
      .json({ success: false, message: "Le joueur choisi doit être vivant." });
    return;
  }

  await makeGhost(gameId, substitute.id); // le remplaçant devient fantôme…
  await revivePlayer(gameId, actor.id); // …et le porteur redevient vivant
  await GhostSubstitution.create({
    gameId,
    holderPlayerId: actor.id,
    substitutePlayerId: substitute.id,
    isActive: true,
  });

  await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
    powerSlug: "horcruxe",
    targetPlayerId: substitute.id,
  });
  notifyStatusChange(gameId);

  res.json({
    success: true,
    message: `Horcruxe activé : ${substitute.characterName} est devenu fantôme à votre place. Vous pouvez désormais utiliser son pouvoir.`,
  });
}

// ── POST /api/games/:id/powers/cupidon ─────────────────────────────────────
export async function useCupidon(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const access = await resolvePowerAccess(gameId, req.user!.userId, "cupidon");
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner } = access;

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

  const existing = await LoveBond.findOne({
    where: {
      gameId,
      [Op.or]: [
        { player1Id: { [Op.in]: [t1, t2] } },
        { player2Id: { [Op.in]: [t1, t2] } },
      ],
    },
  });
  if (existing) {
    res
      .status(400)
      .json({
        success: false,
        message: "Un de ces joueurs est déjà lié par Cupidon.",
      });
    return;
  }

  await LoveBond.create({
    gameId,
    player1Id: t1,
    player2Id: t2,
    createdBy: actor.id,
  });
  await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
    powerSlug: "cupidon",
    targetPlayerId: t1,
    targetPlayerId2: t2,
  });

  // Les deux amoureux voient leur fiche se mettre à jour en direct
  getIO().to(`game:${gameId}`).emit("love:bond");

  res.status(201).json({
    success: true,
    message: `${p1.characterName} et ${p2.characterName} sont désormais liés : leur objectif est de survivre et d'être innocentés ensemble.`,
  });
}
