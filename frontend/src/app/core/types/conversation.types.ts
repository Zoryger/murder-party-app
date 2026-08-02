import { BaseEntity } from './common.types';

export interface Conversation extends BaseEntity {
  gameId:      number;
  player1Id:   number;
  player2Id:   number;
  isFake:      boolean;    // true = créée par l'Usurpateur
  createdBy?:  number;     // id de l'Usurpateur si isFake = true
}

export interface Message extends BaseEntity {
  conversationId: number;
  senderId:       number;
  content:        string;
  sentAt:         Date;
}