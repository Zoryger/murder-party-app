import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface ScenarioPhysicalClueAttributes {
  id:                 number;
  scenarioId:         number;
  relatedCharacterId: number | null;
  name:               string;
  support:            string;
  location:           string;
  effect:             string;
}

interface ScenarioPhysicalClueCreationAttributes
  extends Optional<ScenarioPhysicalClueAttributes, 'id' | 'relatedCharacterId'> {}

class ScenarioPhysicalClue
  extends Model<ScenarioPhysicalClueAttributes, ScenarioPhysicalClueCreationAttributes>
  implements ScenarioPhysicalClueAttributes {
  declare id:                 number;
  declare scenarioId:         number;
  declare relatedCharacterId: number | null;
  declare name:               string;
  declare support:            string;
  declare location:           string;
  declare effect:             string;
}

ScenarioPhysicalClue.init(
  {
    id:                 { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    scenarioId:         { type: DataTypes.INTEGER, allowNull: false },
    relatedCharacterId: { type: DataTypes.INTEGER, allowNull: true },
    name:               { type: DataTypes.STRING(150), allowNull: false },
    support:            { type: DataTypes.TEXT, allowNull: false },
    location:           { type: DataTypes.TEXT, allowNull: false },
    effect:             { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: 'scenario_physical_clues', timestamps: true }
);

export default ScenarioPhysicalClue;