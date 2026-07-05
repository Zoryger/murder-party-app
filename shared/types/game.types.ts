import { BaseEntity, GameStatus } from './common.types';

export interface Game extends BaseEntity {
  name:        string;
  theme:       string;
  synopsis:    string;
  status:      GameStatus;
  joinCode:    string;       // code 6 caractères pour rejoindre
  createdBy:   number;       // user id
  startedAt?:  Date;
  finishedAt?: Date;
}

export interface CreateGameDto {
  name:     string;
  theme:    string;
  synopsis: string;
}