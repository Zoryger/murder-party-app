import { BaseEntity, PlayerStatus, MurderKnowledge } from './common.types';

export interface GamePlayer extends BaseEntity {
  gameId:          number;
  userId?:         number;       // null si personnage sans compte
  characterName:   string;
  characterRole:   string;       // description du personnage
  isMurderer:      boolean;
  murderKnowledge: MurderKnowledge;
  status:          PlayerStatus;
  money:           number;
  messagingCode:   string;       // code unique pour le Chasseur de prime
  isGm:            boolean;      // maître du jeu
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
  id:             number;
  gamePlayerId:   number;
  knowledgeText:  string;
  isGeneral:      boolean; // false = info secrète, uniquement pour ce joueur
}

export interface CreatePlayerDto {
  characterName:   string;
  characterRole:   string;
  isMurderer?:     boolean;
  murderKnowledge?: MurderKnowledge;
  money?:          number;
}