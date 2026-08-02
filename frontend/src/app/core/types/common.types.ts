// ── Enums ─────────────────────────────────────────────────────────────────

export enum PlayerStatus {
  Alive = 'alive',
  Ghost = 'ghost',
}

export enum MurderKnowledge {
  Full    = 'full',    // Rusard — sait tout
  Partial = 'partial', // Lockhart — sait pour Rusard, pas pour le loup-garou
  None    = 'none',    // L'étudiant — ne sait pas qu'il est utilisé
}

export enum GameStatus {
  Waiting  = 'waiting',
  Active   = 'active',
  Finished = 'finished',
}

export enum PowerCategory {
  Info         = 'info',
  Manipulation = 'manipulation',
  Social       = 'social',
  Life         = 'life',
  Economy      = 'economy',
}

export enum RelationType {
  Love      = 'love',
  Friendship= 'friendship',
  Neutral   = 'neutral',
  Rivalry   = 'rivalry',
  Hate      = 'hate',
}

export enum DuelStatus {
  Active   = 'active',
  Voting   = 'voting',
  Finished = 'finished',
}

// ── Interfaces de base ────────────────────────────────────────────────────

export interface BaseEntity {
  id:        number;
  createdAt: Date;
}

// Réponse générique de l'API — T est le type de data
export interface ApiResponse<T> {
  data:     T;
  success:  boolean;
  message?: string;
}