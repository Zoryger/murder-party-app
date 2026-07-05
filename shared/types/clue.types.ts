import { BaseEntity } from './common.types';

export interface Clue extends BaseEntity {
  gameId:       number;
  code:         string;           // code physique à rentrer (ex: "SERR-42")
  content:      string;           // texte de l'indice
  displayName:  string;           // nom affiché (peut être falsifié)
  isModified:   boolean;          // Falsificateur a modifié le displayName
  modifiedName?: string;          // nouveau nom si modifié
  modifiedBy?:  number;           // id du Falsificateur
  isFound:      boolean;
  foundBy?:     number;
}