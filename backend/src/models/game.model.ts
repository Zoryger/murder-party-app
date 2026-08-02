export type GameStatus = 'waiting' | 'active' | 'finished';

export interface Game {
  id:          number;
  name:        string;
  theme:       string;
  synopsis:    string;
  status:      GameStatus;
  joinCode:    string;
  createdBy:   number;
  maxPlayers:  number;
  createdAt:   Date;
  startedAt?:  Date;
  finishedAt?: Date;
}

const games: Game[] = [];
let nextId = 1;

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const GameModel = {
  findAll(): Game[] {
    return games;
  },

  findById(id: number): Game | undefined {
    return games.find(g => g.id === id);
  },

  findByJoinCode(code: string): Game | undefined {
    return games.find(g => g.joinCode === code);
  },

  findByUser(userId: number): Game[] {
    return games.filter(g => g.createdBy === userId);
  },

  create(data: {
    name: string; theme: string; synopsis: string;
    maxPlayers: number; createdBy: number;
  }): Game {
    const game: Game = {
      id: nextId++,
      ...data,
      status:   'waiting',
      joinCode: generateJoinCode(),
      createdAt: new Date(),
    };
    games.push(game);
    return game;
  },

  updateStatus(id: number, status: GameStatus): Game | undefined {
    const game = games.find(g => g.id === id);
    if (!game) return undefined;
    game.status = status;
    if (status === 'active')   game.startedAt  = new Date();
    if (status === 'finished') game.finishedAt = new Date();
    return game;
  },
};