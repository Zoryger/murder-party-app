import { Request, Response } from 'express';
import {
  Scenario, ScenarioCharacter, ScenarioRelation,
  ScenarioRiddle, ScenarioPhysicalClue, ScenarioQrClue, ScenarioPlotThread, Power,
} from '../models/sequelize';

export async function getScenarios(_req: Request, res: Response): Promise<void> {
  const scenarios = await Scenario.findAll();
  res.json({ success: true, data: scenarios });
}

export async function getScenarioBySlug(req: Request, res: Response): Promise<void> {
  const scenario = await Scenario.findOne({ where: { slug: req.params['slug'] } });
  if (!scenario) {
    res.status(404).json({ success: false, message: 'Scénario introuvable.' });
    return;
  }

  const [characters, relations, riddles, physicalClues, qrClues, plotThreads] = await Promise.all([
    ScenarioCharacter.findAll({
      where: { scenarioId: scenario.id },
      include: [{ model: Power, as: 'power' }],
      order: [['displayOrder', 'ASC']],
    }),
    ScenarioRelation.findAll({ where: { scenarioId: scenario.id } }),
    ScenarioRiddle.findAll({ where: { scenarioId: scenario.id }, order: [['displayOrder', 'ASC']] }),
    ScenarioPhysicalClue.findAll({ where: { scenarioId: scenario.id } }),
    ScenarioQrClue.findAll({ where: { scenarioId: scenario.id } }),
    ScenarioPlotThread.findAll({ where: { scenarioId: scenario.id } }),
  ]);

  res.json({
    success: true,
    data: { scenario, characters, relations, riddles, physicalClues, qrClues, plotThreads },
  });
}