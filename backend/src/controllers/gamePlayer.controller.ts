import { Request, Response } from 'express';
import {
  Game, GamePlayer, Scenario, ScenarioCharacter,
  ScenarioRelation, User, Power,
} from '../models/sequelize';
import { getIO } from '../sockets';

function generateMessagingCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ── POST /api/games/:id/join ────────────────────────────────────────────
export async function joinGame(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params['id']);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) { res.status(404).json({ success: false, message: 'Partie introuvable.' }); return; }
  if (game.createdBy === userId) {
    res.status(400).json({ success: false, message: 'Le créateur de la partie est le MJ, il ne peut pas rejoindre en tant que joueur.' });
    return;
  }
  if (game.status !== 'waiting') {
    res.status(400).json({ success: false, message: 'Cette partie a déjà commencé.' });
    return;
  }

  const existing = await GamePlayer.findOne({ where: { gameId, userId } });
  if (existing) { res.json({ success: true, data: existing }); return; }

  const playerCount = await GamePlayer.count({ where: { gameId } });
  if (playerCount >= game.maxPlayers) {
    res.status(400).json({ success: false, message: 'Cette partie est complète.' });
    return;
  }

  const user = await User.findByPk(userId);

  const player = await GamePlayer.create({
    gameId,
    userId,
    characterName:   user?.username ?? 'Joueur',
    characterRole:   "En attente d'assignation",
    isMurderer:      false,
    murderKnowledge: 'not_applicable',
    status:          'alive',
    money:           0,
    messagingCode:   generateMessagingCode(),
    isGm:            false,
  });

  getIO().to(`game:${gameId}`).emit('lobby:update');

  res.status(201).json({ success: true, data: player });
}

// ── GET /api/games/:id/players ──────────────────────────────────────────
export async function getPlayers(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params['id']);

  const players = await GamePlayer.findAll({ where: { gameId }, order: [['createdAt', 'ASC']] });
  const userIds = players.map(p => p.userId).filter((id): id is number => id !== null);
  const users   = await User.findAll({ where: { id: userIds } });
  const usernameById = new Map(users.map(u => [u.id, u.username]));

  // Vue publique uniquement — jamais isMurderer / murderKnowledge / messagingCode
  const publicPlayers = players.map(p => ({
    id:            p.id,
    userId:        p.userId,
    username:      p.userId ? usernameById.get(p.userId) ?? null : null,
    characterName: p.characterName,
    characterRole: p.characterRole,
    isAssigned:    p.scenarioCharacterId !== null,
    status:        p.status,
  }));

  res.json({ success: true, data: publicPlayers });
}

// ── POST /api/games/:id/assign-characters (MJ uniquement) ────────────────
export async function assignCharacters(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params['id']);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) { res.status(404).json({ success: false, message: 'Partie introuvable.' }); return; }
  if (game.createdBy !== userId) { res.status(403).json({ success: false, message: 'Seul le MJ peut assigner les personnages.' }); return; }
  if (game.status !== 'waiting') { res.status(400).json({ success: false, message: 'Cette partie a déjà commencé.' }); return; }
  if (!game.scenarioId) { res.status(400).json({ success: false, message: "Cette partie n'utilise pas de scénario prédéfini." }); return; }

  const scenario     = await Scenario.findByPk(game.scenarioId);
  const players       = await GamePlayer.findAll({ where: { gameId } });
  const allCharacters = await ScenarioCharacter.findAll({ where: { scenarioId: game.scenarioId } });

  if (!scenario) { res.status(404).json({ success: false, message: 'Scénario introuvable.' }); return; }
  if (players.length < scenario.minPlayers) {
    res.status(400).json({ success: false, message: `Il faut au moins ${scenario.minPlayers} joueurs pour ce scénario (actuellement ${players.length}).` });
    return;
  }
  if (players.length > scenario.maxPlayers) {
    res.status(400).json({ success: false, message: `Ce scénario accepte au maximum ${scenario.maxPlayers} joueurs.` });
    return;
  }

  // Les 3 meurtriers sont toujours inclus, le reste est tiré au sort
  const murderers    = allCharacters.filter(c => c.isMurderer);
  const others        = shuffle(allCharacters.filter(c => !c.isMurderer));
  const selectedChars = shuffle([...murderers, ...others.slice(0, players.length - murderers.length)]);

  const powers          = await Power.findAll();
  const shuffledPlayers = shuffle(players);

  await Promise.all(shuffledPlayers.map((player, i) => {
    const character = selectedChars[i]!;
    const power     = powers.find(p => p.id === character.powerId);
    const money     = power?.slug === 'moldue' ? 1000 : 100;

    return player.update({
      scenarioCharacterId: character.id,
      characterName:       character.name,
      characterRole:       character.title,
      isMurderer:          character.isMurderer,
      murderKnowledge:     character.murderKnowledge,
      money,
    });
  }));

  getIO().to(`game:${gameId}`).emit('lobby:assigned');

  res.json({ success: true, message: 'Personnages assignés avec succès.' });
}

// ── POST /api/games/:id/start (MJ uniquement) ─────────────────────────────
export async function startGame(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params['id']);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) { res.status(404).json({ success: false, message: 'Partie introuvable.' }); return; }
  if (game.createdBy !== userId) { res.status(403).json({ success: false, message: 'Seul le MJ peut démarrer la partie.' }); return; }
  if (game.status !== 'waiting') { res.status(400).json({ success: false, message: 'Cette partie a déjà commencé.' }); return; }

  const players = await GamePlayer.findAll({ where: { gameId } });
  if (players.length === 0 || players.some(p => p.scenarioCharacterId === null)) {
    res.status(400).json({ success: false, message: 'Tous les joueurs doivent avoir un personnage assigné avant de démarrer.' });
    return;
  }

  game.status    = 'active';
  game.startedAt = new Date();
  await game.save();

  getIO().to(`game:${gameId}`).emit('game:started');

  res.json({ success: true, data: game });
}

// ── GET /api/games/:id/me ─────────────────────────────────────────────────
export async function getMyCharacterSheet(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params['id']);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) { res.status(404).json({ success: false, message: 'Partie introuvable.' }); return; }

  if (game.createdBy === userId) {
    res.json({ success: true, data: { isGm: true, game } });
    return;
  }

  const player = await GamePlayer.findOne({ where: { gameId, userId } });
  if (!player) {
    res.status(404).json({ success: false, message: "Tu n'as pas encore rejoint cette partie." });
    return;
  }

  if (!player.scenarioCharacterId) {
    res.json({ success: true, data: { isGm: false, isAssigned: false, player } });
    return;
  }

  const character = await ScenarioCharacter.findByPk(player.scenarioCharacterId, {
    include: [{ model: Power, as: 'power' }],
  });

  const relations    = await ScenarioRelation.findAll({ where: { characterId: player.scenarioCharacterId } });
  const otherPlayers  = await GamePlayer.findAll({ where: { gameId } });
  const otherUserIds  = otherPlayers.map(p => p.userId).filter((id): id is number => id !== null);
  const otherUsers    = await User.findAll({ where: { id: otherUserIds } });
  const usernameById  = new Map(otherUsers.map(u => [u.id, u.username]));

  const enrichedRelations = relations.map(rel => {
    const withPlayer = otherPlayers.find(p => p.scenarioCharacterId === rel.relatedCharacterId);
    return {
      relationType:      rel.relationType,
      description:       rel.description,
      isSecret:          rel.isSecret,
      emoji:             rel.emoji,
      withCharacterName: withPlayer?.characterName ?? '???',
      withUsername:      withPlayer?.userId ? usernameById.get(withPlayer.userId) ?? null : null,
    };
  });

  res.json({
    success: true,
    data: {
      isGm: false,
      isAssigned: true,
      player: { id: player.id, status: player.status, money: player.money, messagingCode: player.messagingCode },
      character,
      relations: enrichedRelations,
    },
  });
}