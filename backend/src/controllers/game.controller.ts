import { Request, Response } from 'express';
import { Game, User } from '../models/sequelize';

export async function getGames(req: Request, res: Response): Promise<void> {
  const games = await Game.findAll({
    include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: games });
}

export async function getGameById(req: Request, res: Response): Promise<void> {
  const game = await Game.findByPk(Number(req.params['id']), {
    include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
  });
  if (!game) {
    res.status(404).json({ success: false, message: 'Partie introuvable.' });
    return;
  }
  res.json({ success: true, data: game });
}

export async function createGame(req: Request, res: Response): Promise<void> {
  const { name, theme, synopsis, maxPlayers } = req.body;

  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const game = await Game.create({
    name, theme, synopsis,
    maxPlayers: Number(maxPlayers),
    createdBy:  req.user!.userId,
    joinCode,
    status:     'waiting',
  });

  res.status(201).json({
    success: true,
    message: 'Partie créée avec succès.',
    data:    game,
  });
}

export async function getGameByCode(req: Request, res: Response): Promise<void> {
  const code = req.params['code'].toUpperCase();
  const game = await Game.findOne({ where: { joinCode: code } });

  if (!game) {
    res.status(404).json({ success: false, message: 'Code invalide.' });
    return;
  }
  if (game.status !== 'waiting') {
    res.status(400).json({ success: false, message: 'Cette partie a déjà commencé.' });
    return;
  }
  res.json({ success: true, data: game });
}

export async function updateGameStatus(req: Request, res: Response): Promise<void> {
  const game = await Game.findByPk(Number(req.params['id']));
  if (!game) {
    res.status(404).json({ success: false, message: 'Partie introuvable.' });
    return;
  }
  if (game.createdBy !== req.user!.userId) {
    res.status(403).json({ success: false, message: 'Accès refusé.' });
    return;
  }

  const { status } = req.body;
  game.status = status;
  if (status === 'active')   game.startedAt  = new Date();
  if (status === 'finished') game.finishedAt = new Date();
  await game.save();

  res.json({ success: true, data: game });
}