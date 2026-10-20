import { Request, Response } from "express";
import { Op } from "sequelize";
import {
  Game,
  GamePlayer,
  Scenario,
  ScenarioCharacter,
  ScenarioRelation,
  ScenarioRiddle,
  User,
  Power,
  GameClue,
  ScenarioPhysicalClue,
  LoveBond,
} from "../models/sequelize";
import { getIO } from "../sockets";

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

interface Pairing {
  player: GamePlayer;
  character: ScenarioCharacter;
}

// Applique les couples joueur ↔ personnage.
// Étape 1 : codes temporaires uniques, pour éviter qu'un code d'énigme soit brièvement porté par deux joueurs
// pendant un réassignement (la contrainte d'unicité (partie, code) le refuserait).
async function applyAssignments(
  pairs: Pairing[],
  powers: Power[],
  riddles: ScenarioRiddle[],
): Promise<void> {
  await Promise.all(
    pairs.map(({ player }) =>
      player.update({ messagingCode: generateMessagingCode() }),
    ),
  );

  await Promise.all(
    pairs.map(({ player, character }) => {
      const power = powers.find((p) => p.id === character.powerId);
      const riddle = riddles.find((r) => r.characterId === character.id);

      return player.update({
        scenarioCharacterId: character.id,
        characterName: character.name,
        characterRole: character.title,
        isMurderer: character.isMurderer,
        murderKnowledge: character.murderKnowledge,
        money: power?.slug === "moldue" ? 1000 : 100,
        // Le code de messagerie = le code secret de l'énigme du personnage
        messagingCode: riddle ? riddle.secretCode : generateMessagingCode(),
      });
    }),
  );
}

// ── POST /api/games/:id/join ────────────────────────────────────────────
export async function joinGame(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }
  if (game.createdBy === userId) {
    res
      .status(400)
      .json({
        success: false,
        message:
          "Le créateur de la partie est le MJ, il ne peut pas rejoindre en tant que joueur.",
      });
    return;
  }
  if (game.status !== "waiting") {
    res
      .status(400)
      .json({ success: false, message: "Cette partie a déjà commencé." });
    return;
  }

  const existing = await GamePlayer.findOne({ where: { gameId, userId } });
  if (existing) {
    res.json({ success: true, data: existing });
    return;
  }

  const playerCount = await GamePlayer.count({ where: { gameId } });
  if (playerCount >= game.maxPlayers) {
    res
      .status(400)
      .json({ success: false, message: "Cette partie est complète." });
    return;
  }

  const user = await User.findByPk(userId);

  const player = await GamePlayer.create({
    gameId,
    userId,
    characterName: user?.username ?? "Joueur",
    characterRole: "En attente d'assignation",
    isMurderer: false,
    murderKnowledge: "not_applicable",
    status: "alive",
    money: 0,
    messagingCode: generateMessagingCode(),
    isGm: false,
  });

  getIO().to(`game:${gameId}`).emit("lobby:update");

  res.status(201).json({ success: true, data: player });
}

// ── GET /api/games/:id/players ──────────────────────────────────────────
export async function getPlayers(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);

  const players = await GamePlayer.findAll({
    where: { gameId },
    order: [["createdAt", "ASC"]],
  });
  const userIds = players
    .map((p) => p.userId)
    .filter((id): id is number => id !== null);
  const users = await User.findAll({ where: { id: userIds } });
  const usernameById = new Map(users.map((u) => [u.id, u.username]));

  const publicPlayers = players.map((p) => ({
    id: p.id,
    userId: p.userId,
    username: p.userId ? (usernameById.get(p.userId) ?? null) : null,
    characterName: p.characterName,
    characterRole: p.characterRole,
    isAssigned: p.scenarioCharacterId !== null,
    status: p.status,
  }));

  res.json({ success: true, data: publicPlayers });
}

// ── POST /api/games/:id/assign-characters (MJ — tirage aléatoire) ────────
export async function assignCharacters(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }
  if (game.createdBy !== userId) {
    res
      .status(403)
      .json({
        success: false,
        message: "Seul le MJ peut assigner les personnages.",
      });
    return;
  }
  if (game.status !== "waiting") {
    res
      .status(400)
      .json({ success: false, message: "Cette partie a déjà commencé." });
    return;
  }
  if (!game.scenarioId) {
    res
      .status(400)
      .json({
        success: false,
        message: "Cette partie n'utilise pas de scénario prédéfini.",
      });
    return;
  }

  const scenario = await Scenario.findByPk(game.scenarioId);
  const players = await GamePlayer.findAll({ where: { gameId } });
  const allCharacters = await ScenarioCharacter.findAll({
    where: { scenarioId: game.scenarioId },
  });
  const riddles = await ScenarioRiddle.findAll({
    where: { scenarioId: game.scenarioId },
  });

  if (!scenario) {
    res.status(404).json({ success: false, message: "Scénario introuvable." });
    return;
  }
  if (players.length < scenario.minPlayers) {
    res
      .status(400)
      .json({
        success: false,
        message: `Il faut au moins ${scenario.minPlayers} joueurs pour ce scénario (actuellement ${players.length}).`,
      });
    return;
  }
  if (players.length > scenario.maxPlayers) {
    res
      .status(400)
      .json({
        success: false,
        message: `Ce scénario accepte au maximum ${scenario.maxPlayers} joueurs.`,
      });
    return;
  }

  // Les 3 meurtriers sont toujours inclus, le reste est tiré au sort
  const murderers = allCharacters.filter((c) => c.isMurderer);
  const others = shuffle(allCharacters.filter((c) => !c.isMurderer));
  const selectedChars = shuffle([
    ...murderers,
    ...others.slice(0, players.length - murderers.length),
  ]);

  const powers = await Power.findAll();
  const shuffledPlayers = shuffle(players);

  const pairs: Pairing[] = shuffledPlayers.map((player, i) => ({
    player,
    character: selectedChars[i]!,
  }));
  await applyAssignments(pairs, powers, riddles);

  getIO().to(`game:${gameId}`).emit("lobby:assigned");

  res.json({ success: true, message: "Personnages assignés avec succès." });
}

// ── POST /api/games/:id/assign-manual (MJ — choix précis) ────────────────
// body : { "assignments": [ { "gamePlayerId": 1, "scenarioCharacterId": 2 }, ... ] }
// Les joueurs non listés gardent leur personnage actuel. Aucun minimum de joueurs exigé.
export async function assignManual(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }
  if (game.createdBy !== userId) {
    res
      .status(403)
      .json({
        success: false,
        message: "Seul le MJ peut assigner les personnages.",
      });
    return;
  }
  if (game.status !== "waiting") {
    res
      .status(400)
      .json({ success: false, message: "Cette partie a déjà commencé." });
    return;
  }
  if (!game.scenarioId) {
    res
      .status(400)
      .json({
        success: false,
        message: "Cette partie n'utilise pas de scénario prédéfini.",
      });
    return;
  }

  const raw = req.body.assignments;
  if (!Array.isArray(raw) || raw.length === 0) {
    res
      .status(400)
      .json({
        success: false,
        message: 'Champ "assignments" requis (tableau non vide).',
      });
    return;
  }

  const players = await GamePlayer.findAll({ where: { gameId } });
  const characters = await ScenarioCharacter.findAll({
    where: { scenarioId: game.scenarioId },
  });
  const riddles = await ScenarioRiddle.findAll({
    where: { scenarioId: game.scenarioId },
  });
  const powers = await Power.findAll();

  const pairs: Pairing[] = [];
  for (const a of raw) {
    const player = players.find((p) => p.id === Number(a.gamePlayerId));
    const character = characters.find(
      (c) => c.id === Number(a.scenarioCharacterId),
    );
    if (!player) {
      res
        .status(400)
        .json({
          success: false,
          message: `Joueur introuvable dans cette partie : ${a.gamePlayerId}`,
        });
      return;
    }
    if (!character) {
      res
        .status(400)
        .json({
          success: false,
          message: `Personnage introuvable dans ce scénario : ${a.scenarioCharacterId}`,
        });
      return;
    }
    pairs.push({ player, character });
  }

  if (new Set(pairs.map((p) => p.player.id)).size !== pairs.length) {
    res
      .status(400)
      .json({
        success: false,
        message: "Un joueur apparaît plusieurs fois dans la liste.",
      });
    return;
  }

  // État final : personnage actuel de chaque joueur, écrasé par les nouvelles assignations
  const finalByPlayer = new Map<number, number | null>(
    players.map(
      (p) => [p.id, p.scenarioCharacterId] as [number, number | null],
    ),
  );
  for (const { player, character } of pairs)
    finalByPlayer.set(player.id, character.id);
  const finalCharacterIds = [...finalByPlayer.values()].filter(
    (id): id is number => id !== null,
  );
  if (new Set(finalCharacterIds).size !== finalCharacterIds.length) {
    res
      .status(400)
      .json({
        success: false,
        message: "Un même personnage ne peut pas être attribué à deux joueurs.",
      });
    return;
  }

  await applyAssignments(pairs, powers, riddles);

  getIO().to(`game:${gameId}`).emit("lobby:assigned");

  res.json({
    success: true,
    message: `${pairs.length} personnage(s) assigné(s).`,
  });
}

// ── POST /api/games/:id/start (MJ uniquement) ─────────────────────────────
export async function startGame(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }
  if (game.createdBy !== userId) {
    res
      .status(403)
      .json({ success: false, message: "Seul le MJ peut démarrer la partie." });
    return;
  }
  if (game.status !== "waiting") {
    res
      .status(400)
      .json({ success: false, message: "Cette partie a déjà commencé." });
    return;
  }

  const players = await GamePlayer.findAll({ where: { gameId } });
  if (
    players.length === 0 ||
    players.some((p) => p.scenarioCharacterId === null)
  ) {
    res
      .status(400)
      .json({
        success: false,
        message:
          "Tous les joueurs doivent avoir un personnage assigné avant de démarrer.",
      });
    return;
  }

  game.status = "active";
  game.startedAt = new Date();
  await game.save();

  // Initialise le tableau des indices physiques pour cette partie
  if (game.scenarioId) {
    const existingClues = await GameClue.count({ where: { gameId } });
    if (existingClues === 0) {
      const templates = await ScenarioPhysicalClue.findAll({
        where: { scenarioId: game.scenarioId },
      });
      await GameClue.bulkCreate(
        templates.map((t) => ({
          gameId,
          physicalClueId: t.id,
          currentCharacterId: t.relatedCharacterId,
          isFalsified: false,
        })),
      );
    }
  }

  getIO().to(`game:${gameId}`).emit("game:started");

  res.json({ success: true, data: game });
}

// ── GET /api/games/:id/me ─────────────────────────────────────────────────
export async function getMyCharacterSheet(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const userId = req.user!.userId;

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }

  if (game.createdBy === userId) {
    res.json({ success: true, data: { isGm: true, game } });
    return;
  }

  const player = await GamePlayer.findOne({ where: { gameId, userId } });
  if (!player) {
    res
      .status(404)
      .json({
        success: false,
        message: "Tu n'as pas encore rejoint cette partie.",
      });
    return;
  }

  if (!player.scenarioCharacterId) {
    res.json({
      success: true,
      data: { isGm: false, isAssigned: false, player },
    });
    return;
  }

  const character = await ScenarioCharacter.findByPk(
    player.scenarioCharacterId,
    {
      include: [{ model: Power, as: "power" }],
    },
  );

  const relations = await ScenarioRelation.findAll({
    where: { characterId: player.scenarioCharacterId },
  });
  const otherPlayers = await GamePlayer.findAll({ where: { gameId } });
  const otherUserIds = otherPlayers
    .map((p) => p.userId)
    .filter((id): id is number => id !== null);
  const otherUsers = await User.findAll({ where: { id: otherUserIds } });
  const usernameById = new Map(otherUsers.map((u) => [u.id, u.username]));

  const enrichedRelations = relations.map((rel) => {
    const withPlayer = otherPlayers.find(
      (p) => p.scenarioCharacterId === rel.relatedCharacterId,
    );
    return {
      relationType: rel.relationType,
      description: rel.description,
      isSecret: rel.isSecret,
      emoji: rel.emoji,
      withCharacterName: withPlayer?.characterName ?? "???",
      withUsername: withPlayer?.userId
        ? (usernameById.get(withPlayer.userId) ?? null)
        : null,
    };
  });

  // Lien de Cupidon : visible uniquement par les deux amoureux
  const bond = await LoveBond.findOne({
    where: {
      gameId,
      [Op.or]: [{ player1Id: player.id }, { player2Id: player.id }],
    },
  });
  let loveBond: {
    partnerCharacterName: string;
    partnerUsername: string | null;
    partnerStatus: "alive" | "ghost";
  } | null = null;
  if (bond) {
    const partnerId =
      bond.player1Id === player.id ? bond.player2Id : bond.player1Id;
    const partner = otherPlayers.find((p) => p.id === partnerId);
    loveBond = {
      partnerCharacterName: partner?.characterName ?? "???",
      partnerUsername: partner?.userId
        ? (usernameById.get(partner.userId) ?? null)
        : null,
      partnerStatus: partner?.status ?? "alive",
    };
  }

  res.json({
    success: true,
    data: {
      isGm: false,
      isAssigned: true,
      player: {
        id: player.id,
        status: player.status,
        money: player.money,
        messagingCode: player.messagingCode,
      },
      character,
      relations: enrichedRelations,
      loveBond,
    },
  });
}
