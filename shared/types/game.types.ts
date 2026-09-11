import { BaseEntity, GameStatus } from './common.types';

export interface Game extends BaseEntity {
  name:        string;
  theme:       string;
  synopsis:    string;
  status:      GameStatus;
  joinCode:    string;
  createdBy:   number;
  scenarioId?: number;   // lié à un scénario préconçu (ex: HP2027) — optionnel
  startedAt?:  Date;
  finishedAt?: Date;
}

export interface CreateGameDto {
  name:        string;
  theme:       string;
  synopsis:    string;
  scenarioId?: number;
}