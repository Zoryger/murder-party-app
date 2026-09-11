import { BaseEntity, PlayerStatus, MurderKnowledge } from './common.types';

export interface GamePlayer extends BaseEntity {
  gameId:              number;
  userId?:             number;
  characterName:       string;
  characterRole:       string;
  isMurderer:          boolean;
  murderKnowledge:     MurderKnowledge;
  status:              PlayerStatus;
  money:               number;
  messagingCode:       string;
  isGm:                boolean;
  scenarioCharacterId?: number;  // lié au personnage-modèle du scénario, si applicable
}

export interface PlayerRelation {
  id:           number;
  gameId:       number;
  playerAId:    number;
  playerBId:    number;
  relationType: string;
  isSecret:     boolean;
}

export interface PlayerKnowledge {
  id:            number;
  gamePlayerId:  number;
  knowledgeText: string;
  isGeneral:     boolean;
}

export interface CreatePlayerDto {
  characterName:    string;
  characterRole:    string;
  isMurderer?:      boolean;
  murderKnowledge?: MurderKnowledge;
  money?:           number;
}