import { Request, Response } from "express";
import {
  Scenario,
  ScenarioCharacter,
  ScenarioRelation,
  ScenarioRiddle,
  ScenarioPhysicalClue,
  ScenarioQrClue,
  ScenarioPlotThread,
  Power,
  Game,
  GamePlayer,
} from "../models/sequelize";

// Liste publique : aucune information secrète (titre, pitch, nombre de joueurs)
export async function getScenarios(
  _req: Request,
  res: Response,
): Promise<void> {
  const scenarios = await Scenario.findAll();
  res.json({ success: true, data: scenarios });
}

// Détail complet (meurtriers, codes des énigmes, indices…) : réservé aux MJ de ce scénario
export async function getScenarioBySlug(
  req: Request,
  res: Response,
): Promise<void> {
  const scenario = await Scenario.findOne({
    where: { slug: req.params["slug"] },
  });
  if (!scenario) {
    res.status(404).json({ success: false, message: "Scénario introuvable." });
    return;
  }

  const isGm =
    (await Game.count({
      where: { scenarioId: scenario.id, createdBy: req.user!.userId },
    })) > 0;
  if (!isGm) {
    res
      .status(403)
      .json({
        success: false,
        message: "Réservé aux Maîtres du Jeu de ce scénario.",
      });
    return;
  }

  const [characters, relations, riddles, physicalClues, qrClues, plotThreads] =
    await Promise.all([
      ScenarioCharacter.findAll({
        where: { scenarioId: scenario.id },
        include: [{ model: Power, as: "power" }],
        order: [["displayOrder", "ASC"]],
      }),
      ScenarioRelation.findAll({ where: { scenarioId: scenario.id } }),
      ScenarioRiddle.findAll({
        where: { scenarioId: scenario.id },
        order: [["displayOrder", "ASC"]],
      }),
      ScenarioPhysicalClue.findAll({ where: { scenarioId: scenario.id } }),
      ScenarioQrClue.findAll({ where: { scenarioId: scenario.id } }),
      ScenarioPlotThread.findAll({ where: { scenarioId: scenario.id } }),
    ]);

  res.json({
    success: true,
    data: {
      scenario,
      characters,
      relations,
      riddles,
      physicalClues,
      qrClues,
      plotThreads,
    },
  });
}

// ── GET /api/scenarios/qr/:slug ──────────────────────────────────────────────
// Page secrète d'un QR code : réservée aux joueurs et au MJ d'une partie EN COURS de ce scénario
export async function getQrClue(req: Request, res: Response): Promise<void> {
  const qr = await ScenarioQrClue.findOne({
    where: { slug: req.params["slug"] },
  });
  if (!qr) {
    res.status(404).json({ success: false, message: "QR code inconnu." });
    return;
  }

  const userId = req.user!.userId;
  const activeGames = await Game.findAll({
    where: { scenarioId: qr.scenarioId, status: "active" },
  });
  const gameIds = activeGames.map((g) => g.id);

  const isGm = activeGames.some((g) => g.createdBy === userId);
  const isPlayer =
    gameIds.length > 0 &&
    (await GamePlayer.count({ where: { userId, gameId: gameIds } })) > 0;

  if (!isGm && !isPlayer) {
    res
      .status(403)
      .json({
        success: false,
        message: "Cette page est réservée aux joueurs d'une partie en cours.",
      });
    return;
  }

  res.json({
    success: true,
    data: { title: qr.title, content: qr.content, revelation: qr.revelation },
  });
}
