import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface ScenarioQrClueAttributes {
  id:         number;
  scenarioId: number;
  slug:       string;
  title:      string;
  content:    string;
  revelation: string;
}

interface ScenarioQrClueCreationAttributes extends Optional<ScenarioQrClueAttributes, 'id'> {}

class ScenarioQrClue
  extends Model<ScenarioQrClueAttributes, ScenarioQrClueCreationAttributes>
  implements ScenarioQrClueAttributes {
  declare id:         number;
  declare scenarioId: number;
  declare slug:       string;
  declare title:      string;
  declare content:    string;
  declare revelation: string;
}

ScenarioQrClue.init(
  {
    id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    scenarioId: { type: DataTypes.INTEGER, allowNull: false },
    slug:       { type: DataTypes.STRING(60), allowNull: false, unique: true },
    title:      { type: DataTypes.STRING(150), allowNull: false },
    content:    { type: DataTypes.TEXT, allowNull: false },
    revelation: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: 'scenario_qr_clues', timestamps: true }
);

export default ScenarioQrClue;