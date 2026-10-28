import { Request, Response } from "express";
import {
  Game,
  GamePlayer,
  GameClue,
  ScenarioPhysicalClue,
  ScenarioQrClue,
  ScenarioCluePassword,
  ScenarioCharacter,
  ClueUnlock,
} from "../models/sequelize";
import { hasActiveVisionAbsolue } from "../utils/vision.util";

function replaceCharacterAttribution(
  text: string,
  originalName: string,
  falsifiedName: string,
): string {
  const originalParts = originalName.trim().split(/\s+/);
  const falsifiedParts = falsifiedName.trim().split(/\s+/);
  const originalSurname = originalParts[originalParts.length - 1];
  const falsifiedSurname = falsifiedParts[falsifiedParts.length - 1];
  const replacedName = text.split(originalName).join(falsifiedName);

  if (!originalSurname || !falsifiedSurname || originalSurname === originalName) {
    return replacedName;
  }
  return replacedName.split(originalSurname).join(falsifiedSurname);
}

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

  const unlockedClues = await ClueUnlock.findAll({
    where: { gameId, gamePlayerId: player.id },
    attributes: ["cluePasswordId"],
  });
  const cluePasswords = unlockedClues.length
    ? await ScenarioCluePassword.findAll({
        where: {
          id: unlockedClues
            .map((unlock) => unlock.cluePasswordId)
            .filter((id): id is number => id !== null),
        },
        attributes: ["physicalClueId"],
      })
    : [];
  const unlockedPhysicalIds = cluePasswords
    .map((entry) => entry.physicalClueId)
    .filter((id): id is number => id !== null);
  const clues = unlockedPhysicalIds.length
    ? await GameClue.findAll({
        where: { gameId, physicalClueId: unlockedPhysicalIds },
      })
    : [];
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
      const originalName = t.relatedCharacterId
        ? nameById.get(t.relatedCharacterId)
        : undefined;
      const falsifiedName = c.currentCharacterId
        ? nameById.get(c.currentCharacterId)
        : undefined;
      const canRewriteAttribution =
        c.isFalsified &&
        originalName !== undefined &&
        falsifiedName !== undefined &&
        originalName !== falsifiedName;
      const displayText = (text: string): string =>
        canRewriteAttribution
          ? replaceCharacterAttribution(text, originalName, falsifiedName)
          : text;
      const base = {
        id: c.id,
        name: displayText(t.name),
        support: displayText(t.support),
        location: displayText(t.location),
        effect: displayText(t.effect),
      };
      if (!visionActive) return base;
      return {
        ...base,
        isFalsified: c.isFalsified,
        trueAttribution: c.isFalsified && t.relatedCharacterId
          ? (originalName ?? "???")
          : null,
      };
    }),
  });
}

export async function unlockClue(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const result = await getMyActivePlayer(gameId, req.user!.userId);
  if ("error" in result) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const { player } = result;

  const password = String(req.body.password ?? "").trim().toUpperCase();
  if (!password) {
    res.status(400).json({ success: false, message: "Mot de passe requis." });
    return;
  }

  const passwordEntry = await ScenarioCluePassword.findOne({
    where: { password },
  });
  if (!passwordEntry) {
    res.status(404).json({ success: false, message: "Mot de passe invalide." });
    return;
  }

  const physicalClue = passwordEntry.physicalClueId
    ? await GameClue.findOne({
        where: { gameId, physicalClueId: passwordEntry.physicalClueId },
      })
    : null;

  if (passwordEntry.physicalClueId && !physicalClue) {
    res.status(404).json({ success: false, message: "Mot de passe invalide." });
    return;
  }

  if (passwordEntry.qrClueId && result.game.scenarioId) {
    const qrClue = await ScenarioQrClue.findOne({
      where: { id: passwordEntry.qrClueId, scenarioId: result.game.scenarioId },
    });
    if (qrClue) {
      await ClueUnlock.findOrCreate({
        where: {
          gameId,
          gamePlayerId: player.id,
          cluePasswordId: passwordEntry.id,
        },
        defaults: {
          gameId,
          gamePlayerId: player.id,
          cluePasswordId: passwordEntry.id,
        },
      });
      res.json({
        success: true,
        message: "Document débloqué pour votre dossier.",
        data: { type: "qr", slug: qrClue.slug },
      });
      return;
    }
  }

  if (!physicalClue || !passwordEntry.physicalClueId) {
    res.status(404).json({ success: false, message: "Mot de passe invalide." });
    return;
  }

  await ClueUnlock.findOrCreate({
    where: {
      gameId,
      gamePlayerId: player.id,
      cluePasswordId: passwordEntry.id,
    },
    defaults: {
      gameId,
      gamePlayerId: player.id,
      cluePasswordId: passwordEntry.id,
    },
  });

  res.json({
    success: true,
    message: "Indice débloqué pour votre dossier.",
    data: { type: "physical" },
  });
}
