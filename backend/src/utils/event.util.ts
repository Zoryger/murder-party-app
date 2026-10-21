import { Op } from "sequelize";
import { Duel, DuelVote, GamePlayer, TimedEffect } from "../models/sequelize";
import { makeGhost, notifyStatusChange } from "./status.util";
import { getIO } from "../sockets";

export const VOTE_SECONDS = 60;

const OPEN_STATUSES: Array<Duel["status"]> = ["joust", "voting"];

// Prévient tous les clients de la partie de rafraîchir panne, duel et inversion
export function notifyEventUpdate(gameId: number): void {
  getIO().to(`game:${gameId}`).emit("event:update");
}

// ── Effets chronométrés (panne réseau, inversion de fréquence) ──────────────
export async function getActiveEffect(
  gameId: number,
  type: "blackout" | "inversion",
): Promise<TimedEffect | null> {
  return TimedEffect.findOne({
    where: { gameId, type, cancelledAt: null, endsAt: { [Op.gt]: new Date() } },
    order: [["endsAt", "DESC"]],
  });
}

// ── Résolution d'un code de messagerie ───────────────────────────────────────
// Pendant une Inversion de Fréquence, le code de A désigne B et inversement.
// Rien n'est modifié en base : l'effet disparaît tout seul à l'expiration.
export async function resolvePlayerByCode(
  gameId: number,
  code: string,
): Promise<GamePlayer | null> {
  const owner = await GamePlayer.findOne({
    where: { gameId, messagingCode: code },
  });
  if (!owner) return null;

  const inversion = await TimedEffect.findOne({
    where: {
      gameId,
      type: "inversion",
      cancelledAt: null,
      endsAt: { [Op.gt]: new Date() },
      [Op.or]: [{ player1Id: owner.id }, { player2Id: owner.id }],
    },
  });
  if (!inversion) return owner;

  const otherId =
    inversion.player1Id === owner.id
      ? inversion.player2Id
      : inversion.player1Id;
  return otherId
    ? GamePlayer.findOne({ where: { id: otherId, gameId } })
    : owner;
}

// ── Duels ────────────────────────────────────────────────────────────────────
export async function getLatestDuel(gameId: number): Promise<Duel | null> {
  return Duel.findOne({
    where: { gameId },
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
  });
}

// Votants : tous les vivants sauf les deux duellistes
export async function getEligibleVoters(duel: Duel): Promise<GamePlayer[]> {
  const alive = await GamePlayer.findAll({
    where: { gameId: duel.gameId, status: "alive" },
  });
  return alive.filter(
    (p) => p.id !== duel.challenger1Id && p.id !== duel.challenger2Id,
  );
}

async function finalizeDuel(duel: Duel, votes: DuelVote[]): Promise<void> {
  const for1 = votes.filter((v) => v.votedForId === duel.challenger1Id).length;
  const for2 = votes.filter((v) => v.votedForId === duel.challenger2Id).length;
  // Égalité (ou aucun vote) : personne ne meurt
  const loserId =
    for1 > for2 ? duel.challenger1Id : for2 > for1 ? duel.challenger2Id : null;

  // Seul l'appel qui fait réellement passer le duel de "voting" à "finished" continue
  const [claimed] = await Duel.update(
    { status: "finished", loserId },
    { where: { id: duel.id, status: "voting" } },
  );
  if (claimed !== 1) return;

  if (loserId) {
    await makeGhost(duel.gameId, loserId);
    notifyStatusChange(duel.gameId);
  }
  notifyEventUpdate(duel.gameId);
}

// Fait avancer un duel selon l'heure et les votes. Idempotent : on peut l'appeler autant qu'on veut.
export async function advanceDuel(duelId: number): Promise<Duel | null> {
  let duel = await Duel.findByPk(duelId);
  if (!duel || !OPEN_STATUSES.includes(duel.status)) return duel;

  // Un duelliste n'est plus en vie (tué par un Chasseur de primes…) : le duel est annulé
  const challengers = await GamePlayer.findAll({
    where: { id: [duel.challenger1Id, duel.challenger2Id] },
  });
  if (challengers.some((c) => c.status !== "alive")) {
    const [cancelled] = await Duel.update(
      { status: "cancelled" },
      { where: { id: duelId, status: { [Op.in]: OPEN_STATUSES } } },
    );
    if (cancelled === 1) notifyEventUpdate(duel.gameId);
    return Duel.findByPk(duelId);
  }

  const now = new Date();

  // La joute est terminée : place au vote
  if (duel.status === "joust" && now >= duel.joustEndsAt) {
    const [moved] = await Duel.update(
      { status: "voting" },
      { where: { id: duelId, status: "joust" } },
    );
    if (moved === 1) notifyEventUpdate(duel.gameId);
    duel = await Duel.findByPk(duelId);
    if (!duel) return null;
  }

  // Le vote se clôt à l'heure dite, ou dès que tous les votants ont voté
  if (duel.status === "voting") {
    const eligible = await getEligibleVoters(duel);
    const votes = await DuelVote.findAll({ where: { duelId } });
    const everyoneVoted = eligible.every((p) =>
      votes.some((v) => v.voterId === p.id),
    );

    if (now >= duel.votingEndsAt || everyoneVoted) {
      await finalizeDuel(duel, votes);
      duel = await Duel.findByPk(duelId);
    }
  }

  return duel;
}

// ── Minuteurs serveur ────────────────────────────────────────────────────────
const timers = new Map<number, ReturnType<typeof setTimeout>>();

// Programme le prochain changement de phase. Se reprogramme jusqu'à la fin du duel.
// (Les dates sont arrondies à la seconde par MySQL : on relit toujours la valeur stockée.)
export async function scheduleDuel(duelId: number): Promise<void> {
  const previous = timers.get(duelId);
  if (previous) clearTimeout(previous);

  const duel = await Duel.findByPk(duelId);
  if (!duel || !OPEN_STATUSES.includes(duel.status)) {
    timers.delete(duelId);
    return;
  }

  const target = duel.status === "joust" ? duel.joustEndsAt : duel.votingEndsAt;
  const delay = Math.max(0, target.getTime() - Date.now()) + 300;

  timers.set(
    duelId,
    setTimeout(async () => {
      try {
        await advanceDuel(duelId);
      } catch (err) {
        console.error("advanceDuel :", err);
      }
      await scheduleDuel(duelId).catch((err) =>
        console.error("scheduleDuel :", err),
      );
    }, delay),
  );
}

// Au démarrage du serveur : reprend les duels laissés en cours par un redémarrage
export async function resumeOpenDuels(): Promise<void> {
  const open = await Duel.findAll({
    where: { status: { [Op.in]: OPEN_STATUSES } },
  });
  for (const d of open) {
    await advanceDuel(d.id);
    await scheduleDuel(d.id);
  }
  if (open.length > 0)
    console.log(`⚔️  ${open.length} duel(s) repris après redémarrage`);
}
