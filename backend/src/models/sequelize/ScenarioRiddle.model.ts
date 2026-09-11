import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface ScenarioRiddleAttributes {
  id:           number;
  scenarioId:   number;
  characterId:  number;
  title:        string;
  description:  string;
  secretCode:   string;
  displayOrder: number;
}

interface ScenarioRiddleCreationAttributes extends Optional<ScenarioRiddleAttributes, 'id'> {}

class ScenarioRiddle
  extends Model<ScenarioRiddleAttributes, ScenarioRiddleCreationAttributes>
  implements ScenarioRiddleAttributes {
  declare id:           number;
  declare scenarioId:   number;
  declare characterId:  number;
  declare title:        string;
  declare description:  string;
  declare secretCode:   string;
  declare displayOrder: number;
}

ScenarioRiddle.init(
  {
    id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    scenarioId:   { type: DataTypes.INTEGER, allowNull: false },
    characterId:  { type: DataTypes.INTEGER, allowNull: false },
    title:        { type: DataTypes.STRING(100), allowNull: false },
    description:  { type: DataTypes.TEXT, allowNull: false },
    secretCode:   { type: DataTypes.STRING(40), allowNull: false },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'scenario_riddles', timestamps: true }
);

export default ScenarioRiddle;