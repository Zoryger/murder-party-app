import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

type CharacterGroup = 'trio_criminel' | 'corps_enseignant' | 'eleves' | 'visiteurs_ministere';
type MurderKnowledge = 'full' | 'partial' | 'none' | 'not_applicable';

interface ScenarioCharacterAttributes {
  id:              number;
  scenarioId:      number;
  name:            string;
  title:           string;
  group:           CharacterGroup;
  backstory:       string;
  linkToVictim:    string;
  objective:       string;
  powerId:         number;
  isMurderer:      boolean;
  murderKnowledge: MurderKnowledge;
  displayOrder:    number;
}

interface ScenarioCharacterCreationAttributes
  extends Optional<ScenarioCharacterAttributes, 'id'> {}

class ScenarioCharacter
  extends Model<ScenarioCharacterAttributes, ScenarioCharacterCreationAttributes>
  implements ScenarioCharacterAttributes {
  declare id:              number;
  declare scenarioId:      number;
  declare name:            string;
  declare title:           string;
  declare group:           CharacterGroup;
  declare backstory:       string;
  declare linkToVictim:    string;
  declare objective:       string;
  declare powerId:         number;
  declare isMurderer:      boolean;
  declare murderKnowledge: MurderKnowledge;
  declare displayOrder:    number;
}

ScenarioCharacter.init(
  {
    id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    scenarioId:      { type: DataTypes.INTEGER, allowNull: false },
    name:            { type: DataTypes.STRING(80), allowNull: false },
    title:           { type: DataTypes.STRING(150), allowNull: false },
    group:           { type: DataTypes.ENUM('trio_criminel', 'corps_enseignant', 'eleves', 'visiteurs_ministere'),
                        allowNull: false },
    backstory:       { type: DataTypes.TEXT, allowNull: false },
    linkToVictim:    { type: DataTypes.TEXT, allowNull: false },
    objective:       { type: DataTypes.TEXT, allowNull: false },
    powerId:         { type: DataTypes.INTEGER, allowNull: false },
    isMurderer:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    murderKnowledge: { type: DataTypes.ENUM('full', 'partial', 'none', 'not_applicable'),
                        allowNull: false, defaultValue: 'not_applicable' },
    displayOrder:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'scenario_characters', timestamps: true }
);

export default ScenarioCharacter;