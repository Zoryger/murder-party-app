import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getGames, getGameById, createGame,
  getGameByCode, updateGameStatus,
} from '../controllers/game.controller';
import {
  joinGame, getPlayers, assignCharacters, startGame, getMyCharacterSheet,
} from '../controllers/gamePlayer.controller';
import { validate }    from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

const createRules = [
  body('name').trim().isLength({ min: 3, max: 60 }).withMessage('Nom requis (3–60 car.).'),
  body('theme').trim().notEmpty().withMessage('Thème requis.'),
  body('synopsis').trim().isLength({ min: 30 }).withMessage('Synopsis trop court (30 car. min).'),
  body('maxPlayers').isInt({ min: 4, max: 20 }).withMessage('Entre 4 et 20 joueurs.'),
  body('scenarioId').optional({ nullable: true }).isInt().withMessage('Scénario invalide.'),
];

router.get('/',                 getGames);
router.get('/join/:code',       getGameByCode);
router.get('/:id',              getGameById);
router.post('/',   requireAuth, createRules, validate, createGame);
router.patch('/:id/status', requireAuth, [
  param('id').isInt(),
  body('status').isIn(['waiting', 'active', 'finished']),
], validate, updateGameStatus);

// ── Lobby & assignation des personnages ──────────────────────────────────
router.post('/:id/join',              requireAuth, joinGame);
router.get('/:id/players',            requireAuth, getPlayers);
router.post('/:id/assign-characters', requireAuth, assignCharacters);
router.post('/:id/start',             requireAuth, startGame);
router.get('/:id/me',                 requireAuth, getMyCharacterSheet);

export default router;