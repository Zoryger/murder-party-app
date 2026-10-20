import { GamePlayer, GhostSubstitution } from "../models/sequelize";
import { getIO } from "../sockets";

// Transforme un joueur en fantôme.
// S'il était porteur d'un Horcruxe actif, il perd le pouvoir emprunté.
export async function makeGhost(
  gameId: number,
  playerId: number,
): Promise<void> {
  await GamePlayer.update(
    { status: "ghost" },
    { where: { id: playerId, gameId } },
  );
  await GhostSubstitution.update(
    { isActive: false, deactivatedAt: new Date() },
    { where: { gameId, holderPlayerId: playerId, isActive: true } },
  );
}

// Ramène un joueur à la vie.
// S'il était le remplaçant d'un Horcruxe, le porteur perd le pouvoir emprunté.
export async function revivePlayer(
  gameId: number,
  playerId: number,
): Promise<void> {
  await GamePlayer.update(
    { status: "alive" },
    { where: { id: playerId, gameId } },
  );
  await GhostSubstitution.update(
    { isActive: false, deactivatedAt: new Date() },
    { where: { gameId, substitutePlayerId: playerId, isActive: true } },
  );
}

// Prévient tous les clients de la partie de rafraîchir statuts et pouvoirs
export function notifyStatusChange(gameId: number): void {
  getIO().to(`game:${gameId}`).emit("player:status");
}
