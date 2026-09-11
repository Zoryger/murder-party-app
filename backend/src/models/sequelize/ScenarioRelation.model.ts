import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface ScenarioRelationAttributes {
  id:                 number;
  scenarioId:         number;
  characterId:        number;
  relatedCharacterId: number;
  relationType:       'positive' | 'neutral' | 'negative';
  description:        string;
  isSecret:           boolean;
  emoji:              string | null;
}

interface ScenarioRelationCreationAttributes
  extends Optional<ScenarioRelationAttributes, 'id' | 'emoji'> {}

class ScenarioRelation
  extends Model<ScenarioRelationAttributes, ScenarioRelationCreationAttributes>
  implements ScenarioRelationAttributes {
  declare id:                 number;
  declare scenarioId:         number;
  declare characterId:        number;
  declare relatedCharacterId: number;
  declare relationType:       'positive' | 'neutral' | 'negative';
  declare description:        string;
  declare isSecret:           boolean;
  declare emoji:              string | null;
}

ScenarioRelation.init(
  {
    id:                 { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    scenarioId:         { type: DataTypes.INTEGER, allowNull: false },
    characterId:        { type: DataTypes.INTEGER, allowNull: false },
    relatedCharacterId: { type: DataTypes.INTEGER, allowNull: false },
    relationType:       { type: DataTypes.ENUM('positive', 'neutral', 'negative'), allowNull: false },
    description:        { type: DataTypes.TEXT, allowNull: false },
    isSecret:           { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    emoji:              { type: DataTypes.STRING(8), allowNull: true },
  },
  { sequelize, tableName: 'scenario_relations', timestamps: true }
);

export default ScenarioRelation;