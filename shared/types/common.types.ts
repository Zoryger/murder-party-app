export enum PlayerStatus {
  Alive = 'alive',
  Ghost = 'ghost',
}

export enum MurderKnowledge {
  Full          = 'full',           // Rusard — sait tout
  Partial       = 'partial',        // Lockhart — sait qu'ils sont 2
  None          = 'none',           // Dylan Vance — pense être seul responsable
  NotApplicable = 'not_applicable', // Personnage non-meurtrier
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
  Sabotage     = 'sabotage',
}

export enum RelationType {
  Positive = 'positive',
  Neutral  = 'neutral',
  Negative = 'negative',
}

export enum DuelStatus {
  Active   = 'active',
  Voting   = 'voting',
  Finished = 'finished',
}

export enum CharacterGroup {
  TrioCriminel       = 'trio_criminel',
  CorpsEnseignant    = 'corps_enseignant',
  Eleves             = 'eleves',
  VisiteursMinistere = 'visiteurs_ministere',
}

export interface BaseEntity {
  id:        number;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data:     T;
  success:  boolean;
  message?: string;
}