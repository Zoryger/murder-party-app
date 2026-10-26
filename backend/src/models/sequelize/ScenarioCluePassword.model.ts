import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface ScenarioCluePasswordAttributes {
  id: number;
  physicalClueId: number | null;
  qrClueId: number | null;
  password: string;
}

interface ScenarioCluePasswordCreationAttributes
  extends Optional<ScenarioCluePasswordAttributes, "id"> {}

class ScenarioCluePassword
  extends Model<
    ScenarioCluePasswordAttributes,
    ScenarioCluePasswordCreationAttributes
  >
  implements ScenarioCluePasswordAttributes
{
  declare id: number;
  declare physicalClueId: number | null;
  declare qrClueId: number | null;
  declare password: string;
}

ScenarioCluePassword.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    physicalClueId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    qrClueId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    password: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  },
  { sequelize, tableName: "scenario_clue_passwords", timestamps: false },
);

export default ScenarioCluePassword;
