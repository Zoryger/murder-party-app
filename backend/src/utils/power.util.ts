import { Op } from "sequelize";
import {
  Game,
  GamePlayer,
  Power,
  ScenarioCharacter,
  PowerUse,
  GhostSubstitution,
} from "../models/sequelize";

export interface PowerAccessError {
  error: string;
  status: number;
}
export interface PowerAccessOk {
  game: Game;
  actor: GamePlayer; // celui qui clique
  owner: GamePlayer; // celui dont on consomme les utilisations (≠ actor si pouvoir emprunté)
  power: Power;
  usesRemaining: number;
  borrowed: boolean;
}
export type PowerAccess = PowerAccessError | PowerAccessOk;

export async function getPowerOfPlayer(
  player: GamePlayer,
): Promise<Power | null> {
  if (!player.scenarioCharacterId) return null;
  const character = await ScenarioCharacter.findByPk(
    player.scenarioCharacterId,
  );
  return character ? Power.findByPk(character.powerId) : null;
}

// Les anciennes lignes (avant l'Horcruxe) n'ont pas d'ownerPlayerId : on retombe sur gamePlayerId
export async function getUsesRemaining(
  ownerPlayerId: number,
  powerSlug: string,
  maxUses: number,
): Promise<number> {
  if (maxUses === 0) return 0;
  const used = await PowerUse.count({
    where: {
      powerSlug,
      [Op.or]: [
        { ownerPlayerId },
        { ownerPlayerId: null, gamePlayerId: ownerPlayerId },
      ],
    },
  });
  return Math.max(0, maxUses - used);
}

export function computeAvailability(
  status: "alive" | "ghost",
  slug: string,
  maxUses: number,
  usesRemaining: number,
): { canUse: boolean; lockedReason: string | null } {
  if (slug === "horcruxe") {
    if (maxUses > 0 && usesRemaining <= 0)
      return {
        canUse: false,
        lockedReason: "Vous avez déjà utilisé votre Horcruxe.",
      };
    if (status === "alive")
      return {
        canUse: false,
        lockedReason:
          "L'Horcruxe ne s'active que lorsque vous devenez un fantôme.",
      };
    return { canUse: true, lockedReason: null };
  }
  if (status === "ghost") {
    return {
      canUse: false,
      lockedReason:
        "Les fantômes ne peuvent plus utiliser leur pouvoir. Seul un Nécromancien peut vous réanimer.",
    };
  }
  if (slug === "voyante") return { canUse: true, lockedReason: null };
  if (maxUses > 0 && usesRemaining <= 0)
    return { canUse: false, lockedReason: "Vous avez épuisé ce pouvoir." };
  return { canUse: true, lockedReason: null };
}

export async function resolvePowerAccess(
  gameId: number,
  userId: number,
  slug: string,
  opts: { allowGhost?: boolean } = {},
): Promise<PowerAccess> {
  const game = await Game.findByPk(gameId);
  if (!game || game.status !== "active")
    return { error: "La partie n'est pas en cours.", status: 400 };

  const actor = await GamePlayer.findOne({ where: { gameId, userId } });
  if (!actor)
    return { error: "Vous n'êtes pas dans cette partie.", status: 403 };
  if (!actor.scenarioCharacterId)
    return { error: "Aucun personnage assigné.", status: 400 };

  // 1) Mon propre pouvoir
  const ownPower = await getPowerOfPlayer(actor);
  if (ownPower && ownPower.slug === slug) {
    if (actor.status !== "alive" && !opts.allowGhost) {
      return {
        error: "Les fantômes ne peuvent plus utiliser leur pouvoir.",
        status: 400,
      };
    }
    const usesRemaining = await getUsesRemaining(
      actor.id,
      ownPower.slug,
      ownPower.maxUses,
    );
    if (ownPower.slug !== "voyante" && ownPower.maxUses > 0 && usesRemaining <= 0)
      return { error: "Vous avez épuisé ce pouvoir.", status: 400 };
    return {
      game,
      actor,
      owner: actor,
      power: ownPower,
      usesRemaining,
      borrowed: false,
    };
  }

  // 2) Pouvoir emprunté via un Horcruxe actif
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
        if (borrowedPower && borrowedPower.slug === slug) {
          const usesRemaining = await getUsesRemaining(
            substitute.id,
            borrowedPower.slug,
            borrowedPower.maxUses,
          );
          if (
            borrowedPower.slug !== "voyante" &&
            borrowedPower.maxUses > 0 &&
            usesRemaining <= 0
          ) {
            return {
              error: "Ce pouvoir emprunté n'a plus d'utilisations.",
              status: 400,
            };
          }
          return {
            game,
            actor,
            owner: substitute,
            power: borrowedPower,
            usesRemaining,
            borrowed: true,
          };
        }
      }
    }
  }

  return { error: "Vous ne possédez pas ce pouvoir.", status: 403 };
}
