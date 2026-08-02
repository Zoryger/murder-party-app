import { Request, Response } from 'express';
import { GameModel } from '../models/game.model';

// GET /api/games
export function getGames(req: Request, res: Response): void {
  const games = GameModel.findAll();
  res.json({ success: true, data: games });
}

// GET /api/games/:id
export function getGameById(req: Request, res: Response): void {
  const id   = Number(req.params['id']);
  const game = GameModel.findById(id);
  if (!game) {
    res.status(404).json({ success: false, message: 'Partie introuvable.' });
    return;
  }
  res.json({ success: true, data: game });
}

// POST /api/games  (protégé — requiert JWT)
export function createGame(req: Request, res: Response): void {
  const { name, theme, synopsis, maxPlayers } = req.body;

  const game = GameModel.create({
    name,
    theme,
    synopsis,
    maxPlayers: Number(maxPlayers),
    createdBy: req.user!.userId,
  });

  res.status(201).json({
    success: true,
    message: 'Partie créée avec succès.',
    data: game,
  });
}

// GET /api/games/join/:code  (rejoindre via code)
export function getGameByCode(req: Request, res: Response): void {
  const code = req.params['code'].toUpperCase();
  const game = GameModel.findByJoinCode(code);
  if (!game) {
    res.status(404).json({ success: false, message: 'Code de partie invalide.' });
    return;
  }
  if (game.status !== 'waiting') {
    res.status(400).json({ success: false, message: 'Cette partie a déjà commencé.' });
    return;
  }
  res.json({ success: true, data: game });
}

// PATCH /api/games/:id/status  (protégé — changer le statut)
export function updateGameStatus(req: Request, res: Response): void {
  const id     = Number(req.params['id']);
  const { status } = req.body;

  const game = GameModel.findById(id);
  if (!game) {
    res.status(404).json({ success: false, message: 'Partie introuvable.' });
    return;
  }
  if (game.createdBy !== req.user!.userId) {
    res.status(403).json({ success: false, message: 'Seul le créateur peut modifier cette partie.' });
    return;
  }

  const updated = GameModel.updateStatus(id, status);
  res.json({ success: true, data: updated });
}