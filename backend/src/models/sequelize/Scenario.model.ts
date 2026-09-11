import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface ScenarioAttributes {
  id:              number;
  slug:            string;
  name:            string;
  pitch:           string;
  minPlayers:      number;
  maxPlayers:      number;
  durationMinutes: number;
  createdAt?:      Date;
  updatedAt?:      Date;
}

interface ScenarioCreationAttributes extends Optional<ScenarioAttributes, 'id'> {}

class Scenario extends Model<ScenarioAttributes, ScenarioCreationAttributes>
  implements ScenarioAttributes {
  declare id:              number;
  declare slug:            string;
  declare name:            string;
  declare pitch:           string;
  declare minPlayers:      number;
  declare maxPlayers:      number;
  declare durationMinutes: number;
}

Scenario.init(
  {
    id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug:            { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name:            { type: DataTypes.STRING(100), allowNull: false },
    pitch:           { type: DataTypes.TEXT, allowNull: false },
    minPlayers:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    maxPlayers:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 240 },
  },
  { sequelize, tableName: 'scenarios', timestamps: true }
);

export default Scenario;