import { Request, Response } from "express";
import {
  Game,
  GamePlayer,
  GameClue,
  ScenarioPhysicalClue,
  ScenarioCharacter,
} from "../models/sequelize";
import { hasActiveVisionAbsolue } from "../utils/vision.util";

async function getMyActivePlayer(gameId: number, userId: number) {
  const game = await Game.findByPk(gameId);
  if (!game || game.status !== "active")
    return { error: "La partie n'est pas en cours." };

  const player = await GamePlayer.findOne({ where: { gameId, userId } });
  if (!player) return { error: "Vous n'êtes pas dans cette partie." };

  return { game, player };
}

// ── GET /api/games/:id/clues ────────────────────────────────────────────
export async function getClueBoard(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const result = await getMyActivePlayer(gameId, req.user!.userId);
  if ("error" in result) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const { player } = result;

  const clues = await GameClue.findAll({ where: { gameId } });
  const templateIds = clues.map((c) => c.physicalClueId);
  const templates = await ScenarioPhysicalClue.findAll({
    where: { id: templateIds },
  });
  const templateById = new Map(templates.map((t) => [t.id, t]));

  const visionActive = await hasActiveVisionAbsolue(player.id);

  const charIds = [
    ...clues.map((c) => c.currentCharacterId),
    ...templates.map((t) => t.relatedCharacterId),
  ].filter((id): id is number => id !== null && id !== undefined);
  const characters = await ScenarioCharacter.findAll({
    where: { id: [...new Set(charIds)] },
  });
  const nameById = new Map(characters.map((c) => [c.id, c.name]));

  res.json({
    success: true,
    data: clues.map((c) => {
      const t = templateById.get(c.physicalClueId)!;
      const base = {
        id: c.id,
        name: t.name,
        support: t.support,
        location: t.location,
        effect: t.effect,
        attributedTo: c.currentCharacterId
          ? (nameById.get(c.currentCharacterId) ?? "???")
          : null,
      };
      if (!visionActive) return base;
      return {
        ...base,
        isFalsified: c.isFalsified,
        trueAttribution: t.relatedCharacterId
          ? (nameById.get(t.relatedCharacterId) ?? "???")
          : null,
      };
    }),
  });
}
