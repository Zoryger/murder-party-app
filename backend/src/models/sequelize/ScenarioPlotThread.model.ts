import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface ScenarioPlotThreadAttributes {
  id:          number;
  scenarioId:  number;
  title:       string;
  description: string;
}

interface ScenarioPlotThreadCreationAttributes
  extends Optional<ScenarioPlotThreadAttributes, 'id'> {}

class ScenarioPlotThread
  extends Model<ScenarioPlotThreadAttributes, ScenarioPlotThreadCreationAttributes>
  implements ScenarioPlotThreadAttributes {
  declare id:          number;
  declare scenarioId:  number;
  declare title:       string;
  declare description: string;
}

ScenarioPlotThread.init(
  {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    scenarioId:  { type: DataTypes.INTEGER, allowNull: false },
    title:       { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: 'scenario_plot_threads', timestamps: true }
);

export default ScenarioPlotThread;