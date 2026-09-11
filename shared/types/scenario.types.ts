import { BaseEntity, MurderKnowledge, RelationType, CharacterGroup } from './common.types';
import { Power } from './power.types';

export interface Scenario extends BaseEntity {
  slug:            string;
  name:            string;
  pitch:           string;
  minPlayers:      number;
  maxPlayers:      number;
  durationMinutes: number;
}

export interface ScenarioCharacter extends BaseEntity {
  scenarioId:      number;
  name:            string;
  title:           string;
  group:           CharacterGroup;
  backstory:       string;
  linkToVictim:    string;
  objective:       string;
  powerId:         number;
  power?:          Power;
  isMurderer:      boolean;
  murderKnowledge: MurderKnowledge;
  displayOrder:    number;
}

export interface ScenarioRelation {
  id:                 number;
  scenarioId:         number;
  characterId:        number;  // point de vue
  relatedCharacterId: number;  // personne décrite
  relationType:       RelationType;
  description:        string;
  isSecret:           boolean;
  emoji?:             string;
}

export interface ScenarioRiddle {
  id:           number;
  scenarioId:   number;
  characterId:  number;   // dont ça révèle le code secret
  title:        string;
  description:  string;
  secretCode:   string;
  displayOrder: number;
}

export interface ScenarioPhysicalClue {
  id:                  number;
  scenarioId:          number;
  relatedCharacterId?: number;
  name:                string;
  support:             string;
  location:            string;
  effect:              string;
}

export interface ScenarioQrClue {
  id:         number;
  scenarioId: number;
  slug:       string;
  title:      string;
  content:    string;
  revelation: string;
}

export interface ScenarioPlotThread {
  id:          number;
  scenarioId:  number;
  title:       string;
  description: string;
}

export interface ScenarioDetail {
  scenario:      Scenario;
  characters:    ScenarioCharacter[];
  relations:     ScenarioRelation[];
  riddles:       ScenarioRiddle[];
  physicalClues: ScenarioPhysicalClue[];
  qrClues:       ScenarioQrClue[];
  plotThreads:   ScenarioPlotThread[];
}