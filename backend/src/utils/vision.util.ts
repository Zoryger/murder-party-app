import { PowerUse, Power } from "../models/sequelize";

// Vrai si le joueur a activé Vision absolue il y a moins de `durationSeconds`
export async function hasActiveVisionAbsolue(
  gamePlayerId: number,
): Promise<boolean> {
  const lastUse = await PowerUse.findOne({
    where: { gamePlayerId, powerSlug: "vision-absolue" },
    order: [["createdAt", "DESC"]],
  });
  if (!lastUse) return false;

  const power = await Power.findOne({ where: { slug: "vision-absolue" } });
  const durationMs = (power?.durationSeconds ?? 60) * 1000;

  return Date.now() - new Date(lastUse.createdAt).getTime() < durationMs;
}
