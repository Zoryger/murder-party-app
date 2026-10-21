import { Request, Response } from "express";
import { Op, UniqueConstraintError } from "sequelize";
import {
  Game,
  GamePlayer,
  Duel,
  DuelVote,
  TimedEffect,
  PowerUse,
} from "../models/sequelize";
import { resolvePowerAccess } from "../utils/power.util";
import type { PowerAccessError } from "../utils/power.util";
import { hasActiveVisionAbsolue } from "../utils/vision.util";
import {
  VOTE_SECONDS,
  notifyEventUpdate,
  getActiveEffect,
  getLatestDuel,
  getEligibleVoters,
  advanceDuel,
  scheduleDuel,
} from "../utils/event.util";

function denied(res: Response, access: PowerAccessError): void {
  res.status(access.status).json({ success: false, message: access.error });
}

function durationLabel(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes >= 1
    ? `${minutes} minute${minutes > 1 ? "s" : ""}`
    : `${seconds} secondes`;
}

// ── GET /api/games/:id/events ───────────────────────────────────────────────
// État des événements visibles par le demandeur : panne, duel, inversion.
export async function getEvents(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }

  const isGm = game.createdBy === userId;
  const me = isGm
    ? null
    : await GamePlayer.findOne({ where: { gameId, userId } });
  if (!isGm && !me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }

  const state: {
    serverNow: Date;
    isGm: boolean;
    blackout: { endsAt: Date; startedByMe: boolean } | null;
    duel: Record<string, unknown> | null;
    inversion: {
      endsAt: Date;
      player1Name: string;
      player2Name: string;
      revealedByVision: boolean;
    } | null;
  } = {
    serverNow: new Date(),
    isGm,
    blackout: null,
    duel: null,
    inversion: null,
  };

  if (game.status !== "active") {
    res.json({ success: true, data: state });
    return;
  }

  const players = await GamePlayer.findAll({ where: { gameId } });
  const nameById = new Map(players.map((p) => [p.id, p.characterName]));
  const myId = me?.id ?? null;

  // Panne réseau
  const blackout = await getActiveEffect(gameId, "blackout");
  if (blackout)
    state.blackout = {
      endsAt: blackout.endsAt,
      startedByMe: blackout.createdBy === myId,
    };

  // Duel : ouvert, ou terminé depuis moins de 2 minutes (pour afficher le résultat)
  const latest = await getLatestDuel(gameId);
  const duel = latest ? await advanceDuel(latest.id) : null;
  if (duel) {
    const isOpen = duel.status === "joust" || duel.status === "voting";
    const recentlyClosed =
      !isOpen && Date.now() - new Date(duel.updatedAt).getTime() < 120_000;

    if (isOpen || recentlyClosed) {
      const votes = await DuelVote.findAll({ where: { duelId: duel.id } });
      const eligible = await getEligibleVoters(duel);
      const isChallenger =
        myId === duel.challenger1Id || myId === duel.challenger2Id;
      const hasVoted = myId !== null && votes.some((v) => v.voterId === myId);
      const canVote =
        duel.status === "voting" &&
        myId !== null &&
        !hasVoted &&
        eligible.some((p) => p.id === myId);

      const challengerIds = [duel.challenger1Id, duel.challenger2Id];

      state.duel = {
        id: duel.id,
        status: duel.status,
        challengers: challengerIds.map((id) => ({
          id,
          characterName: nameById.get(id) ?? "???",
        })),
        joustEndsAt: duel.joustEndsAt,
        votingEndsAt: duel.votingEndsAt,
        isChallenger,
        canVote,
        hasVoted,
        votesCount: votes.length,
        eligibleCount: eligible.length,
        // Le détail des votes n'est révélé qu'à la fin
        result: isOpen
          ? null
          : {
              outcome:
                duel.status === "cancelled"
                  ? "cancelled"
                  : duel.loserId
                    ? "loser"
                    : "tie",
              loserName: duel.loserId
                ? (nameById.get(duel.loserId) ?? "???")
                : null,
              tally: challengerIds.map((id) => ({
                name: nameById.get(id) ?? "???",
                votes: votes.filter((v) => v.votedForId === id).length,
              })),
            },
      };
    }
  }

  // Inversion de fréquence : silencieuse. Visible par son lanceur, le MJ, ou une Vision absolue active.
  const inversion = await getActiveEffect(gameId, "inversion");
  if (inversion) {
    const isCaster = myId !== null && inversion.createdBy === myId;
    const hasVision =
      myId !== null && !isCaster && (await hasActiveVisionAbsolue(myId));
    if (isGm || isCaster || hasVision) {
      state.inversion = {
        endsAt: inversion.endsAt,
        player1Name: nameById.get(inversion.player1Id!) ?? "???",
        player2Name: nameById.get(inversion.player2Id!) ?? "???",
        revealedByVision: hasVision,
      };
    }
  }

  res.json({ success: true, data: state });
}

// ── POST /api/games/:id/duels/:duelId/vote ──────────────────────────────────
export async function voteDuel(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const duelId = Number(req.params["duelId"]);
  const votedForId = Number(req.body.votedForId);

  const game = await Game.findByPk(gameId);
  if (!game || game.status !== "active") {
    res
      .status(400)
      .json({ success: false, message: "La partie n'est pas en cours." });
    return;
  }

  const me = await GamePlayer.findOne({
    where: { gameId, userId: req.user!.userId },
  });
  if (!me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }

  const found = await Duel.findOne({ where: { id: duelId, gameId } });
  if (!found) {
    res.status(404).json({ success: false, message: "Duel introuvable." });
    return;
  }

  // La phase a pu changer depuis le dernier affichage : on la remet à jour avant de décider
  const duel = await advanceDuel(found.id);
  if (!duel || duel.status !== "voting") {
    res
      .status(400)
      .json({ success: false, message: "Le vote n'est pas (ou plus) ouvert." });
    return;
  }
  if (me.status !== "alive") {
    res
      .status(403)
      .json({ success: false, message: "Les fantômes ne votent pas." });
    return;
  }
  if (me.id === duel.challenger1Id || me.id === duel.challenger2Id) {
    res
      .status(403)
      .json({ success: false, message: "Les duellistes ne votent pas." });
    return;
  }
  if (votedForId !== duel.challenger1Id && votedForId !== duel.challenger2Id) {
    res
      .status(400)
      .json({ success: false, message: "Choisissez un des deux duellistes." });
    return;
  }

  try {
    await DuelVote.create({ duelId: duel.id, voterId: me.id, votedForId });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(400).json({ success: false, message: "Vous avez déjà voté." });
      return;
    }
    throw err;
  }

  await advanceDuel(duel.id); // si tout le monde a voté, le duel est conclu immédiatement
  notifyEventUpdate(gameId);

  res.status(201).json({ success: true, message: "Vote enregistré." });
}

// ── POST /api/games/:id/events/cancel-blackout (MJ uniquement) ───────────────
export async function cancelBlackout(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }
  if (game.createdBy !== req.user!.userId) {
    res
      .status(403)
      .json({ success: false, message: "Seul le MJ peut annuler une panne." });
    return;
  }

  const [cancelled] = await TimedEffect.update(
    { cancelledAt: new Date() },
    {
      where: {
        gameId,
        type: "blackout",
        cancelledAt: null,
        endsAt: { [Op.gt]: new Date() },
      },
    },
  );
  notifyEventUpdate(gameId);

  res.json({
    success: true,
    message: cancelled > 0 ? "Panne réseau annulée." : "Aucune panne en cours.",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  POUVOIRS — Phase 5.6
// ═══════════════════════════════════════════════════════════════════════════

// ── POST /api/games/:id/powers/duelliste ────────────────────────────────────
export async function useDuelliste(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "duelliste",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner, power } = access;

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
      .json({
        success: false,
        message: "Le Duelliste ne peut pas participer à son propre duel.",
      });
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
  if (p1.status !== "alive" || p2.status !== "alive") {
    res
      .status(400)
      .json({
        success: false,
        message: "Les deux duellistes doivent être vivants.",
      });
    return;
  }

  // Un seul duel à la fois
  const latest = await getLatestDuel(gameId);
  if (latest) {
    const fresh = await advanceDuel(latest.id);
    if (fresh && (fresh.status === "joust" || fresh.status === "voting")) {
      res
        .status(400)
        .json({ success: false, message: "Un duel est déjà en cours." });
      return;
    }
  }

  const joustSeconds = power.durationSeconds ?? 180;
  const joustEndsAt = new Date(Date.now() + joustSeconds * 1000);
  const votingEndsAt = new Date(joustEndsAt.getTime() + VOTE_SECONDS * 1000);

  const duel = await Duel.create({
    gameId,
    createdBy: actor.id,
    challenger1Id: t1,
    challenger2Id: t2,
    status: "joust",
    joustEndsAt,
    votingEndsAt,
  });

  await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
    powerSlug: "duelliste",
    targetPlayerId: t1,
    targetPlayerId2: t2,
  });

  void scheduleDuel(duel.id);
  notifyEventUpdate(gameId);

  res.status(201).json({
    success: true,
    message: `Duel lancé : ${p1.characterName} contre ${p2.characterName}. Joute verbale de ${durationLabel(joustSeconds)}, puis vote des vivants.`,
  });
}

// ── POST /api/games/:id/powers/inversion-de-frequence ──────────────────────
export async function useInversionFrequence(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "inversion-de-frequence",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner, power } = access;

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
  if (!p1 || !p2) {
    res.status(404).json({ success: false, message: "Joueur introuvable." });
    return;
  }

  // Un joueur ne peut pas être dans deux inversions à la fois (sinon la résolution serait ambiguë)
  const clash = await TimedEffect.findOne({
    where: {
      gameId,
      type: "inversion",
      cancelledAt: null,
      endsAt: { [Op.gt]: new Date() },
      [Op.or]: [
        { player1Id: { [Op.in]: [t1, t2] } },
        { player2Id: { [Op.in]: [t1, t2] } },
      ],
    },
  });
  if (clash) {
    res
      .status(400)
      .json({
        success: false,
        message:
          "Un de ces joueurs est déjà concerné par une inversion en cours.",
      });
    return;
  }

  const seconds = power.durationSeconds ?? 600;
  await TimedEffect.create({
    gameId,
    type: "inversion",
    createdBy: actor.id,
    player1Id: t1,
    player2Id: t2,
    endsAt: new Date(Date.now() + seconds * 1000),
  });

  await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
    powerSlug: "inversion-de-frequence",
    targetPlayerId: t1,
    targetPlayerId2: t2,
  });

  notifyEventUpdate(gameId);

  res.status(201).json({
    success: true,
    message: `Les codes de ${p1.characterName} et ${p2.characterName} sont inversés pendant ${durationLabel(seconds)}.`,
  });
}

// ── POST /api/games/:id/powers/brouilleur-iem ──────────────────────────────
export async function useBrouilleurIem(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "brouilleur-iem",
  );
  if ("error" in access) {
    denied(res, access);
    return;
  }
  const { actor, owner, power } = access;

  // Déjà garanti par blackoutGuard, revérifié ici car deux requêtes simultanées peuvent se croiser
  if (await getActiveEffect(gameId, "blackout")) {
    res
      .status(400)
      .json({ success: false, message: "Une panne réseau est déjà en cours." });
    return;
  }

  const seconds = power.durationSeconds ?? 900;
  const endsAt = new Date(Date.now() + seconds * 1000);

  await TimedEffect.create({
    gameId,
    type: "blackout",
    createdBy: actor.id,
    endsAt,
  });

  await PowerUse.create({
    gameId,
    gamePlayerId: actor.id,
    ownerPlayerId: owner.id,
    powerSlug: "brouilleur-iem",
  });

  notifyEventUpdate(gameId);

  res.status(201).json({
    success: true,
    message: `Panne réseau déclenchée pour ${durationLabel(seconds)} : messageries, codes, pouvoirs et indices sont coupés pour tout le monde, vous compris.`,
    data: { endsAt },
  });
}
