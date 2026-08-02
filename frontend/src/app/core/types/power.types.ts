import { BaseEntity, PowerCategory } from './common.types';

export interface Power extends BaseEntity {
  name:            string;
  readonly slug:   string;        // identifiant unique ex: 'informaticien'
  category:        PowerCategory;
  description:     string;
  maxUses:         number;
  durationSeconds?: number;       // pour Vision absolue (60s)
}

// Pouvoir attribué à un joueur dans une partie
export interface PlayerPower {
  id:               number;
  gamePlayerId:     number;
  powerId:          number;
  usesRemaining:    number;
  isActive:         boolean;
  borrowedFromId?:  number; // Orcrux — id du joueur dont on utilise le pouvoir
  power?:           Power;  // jointure optionnelle
}