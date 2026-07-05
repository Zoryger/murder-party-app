import { DuelStatus } from './common.types';

// Cupidon
export interface LoveBond {
  id:          number;
  gameId:      number;
  player1Id:   number;
  player2Id:   number;
  createdBy:   number;   // id du joueur Cupidon
  isActive:    boolean;
  createdAt:   Date;
}

// Orcrux
export interface GhostSubstitution {
  id:                  number;
  gameId:              number;
  orcruxPlayerId:      number;   // joueur avec le pouvoir Orcrux
  substitutePlayerId:  number;   // joueur qui prend sa place de fantôme
  isActive:            boolean;
  createdAt:           Date;
  deactivatedAt?:      Date;
}

// Duelliste
export interface Duel {
  id:           number;
  gameId:       number;
  challengerId: number;
  targetId:     number;
  status:       DuelStatus;
  startedAt:    Date;
  endsAt:       Date;      // startedAt + 3 minutes
  loserId?:     number;
}

export interface DuelVote {
  id:            number;
  duelId:        number;
  voterPlayerId: number;
  votedForId:    number;
  votedAt:       Date;
}

// Nécromancie
export interface NecromancyRevival {
  id:                number;
  gameId:            number;
  necromancerPlayerId: number;
  revivedPlayerId:   number;
  revivedAt:         Date;
}

// Vote final
export interface FinalVote {
  id:            number;
  gameId:        number;
  voterPlayerId: number;
  suspectId:     number;
  votedAt:       Date;
}