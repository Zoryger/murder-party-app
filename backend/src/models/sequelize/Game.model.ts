import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface GameAttributes {
  id:          number;
  name:        string;
  theme:       string;
  synopsis:    string;
  status:      'waiting' | 'active' | 'finished';
  joinCode:    string;
  createdBy:   number;
  maxPlayers:  number;
  scenarioId?: number | null;
  startedAt?:  Date | null;
  finishedAt?: Date | null;
  createdAt?:  Date;
  updatedAt?:  Date;
}

interface GameCreationAttributes
  extends Optional<GameAttributes, 'id' | 'startedAt' | 'finishedAt' | 'scenarioId'> {}

class Game extends Model<GameAttributes, GameCreationAttributes>
  implements GameAttributes {
  declare id:          number;
  declare name:        string;
  declare theme:       string;
  declare synopsis:    string;
  declare status:      'waiting' | 'active' | 'finished';
  declare joinCode:    string;
  declare createdBy:   number;
  declare maxPlayers:  number;
  declare scenarioId:  number | null;
  declare startedAt:   Date | null;
  declare finishedAt:  Date | null;
  declare createdAt:   Date;
  declare updatedAt:   Date;
}

Game.init(
  {
    id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:       { type: DataTypes.STRING(60),  allowNull: false },
    theme:      { type: DataTypes.STRING(100), allowNull: false },
    synopsis:   { type: DataTypes.TEXT,        allowNull: false },
    status:     { type: DataTypes.ENUM('waiting', 'active', 'finished'),
                  allowNull: false, defaultValue: 'waiting' },
    joinCode:   { type: DataTypes.STRING(10),  allowNull: false, unique: true },
    createdBy:  { type: DataTypes.INTEGER,     allowNull: false },
    maxPlayers: { type: DataTypes.INTEGER,     allowNull: false, defaultValue: 8 },
    scenarioId: { type: DataTypes.INTEGER,     allowNull: true },
    startedAt:  { type: DataTypes.DATE,        allowNull: true },
    finishedAt: { type: DataTypes.DATE,        allowNull: true },
  },
  { sequelize, tableName: 'games', timestamps: true }
);

export default Game;