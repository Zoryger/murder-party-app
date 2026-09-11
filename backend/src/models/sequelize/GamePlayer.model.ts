import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface GamePlayerAttributes {
  id:                   number;
  gameId:                number;
  userId?:               number | null;
  characterName:         string;
  characterRole:         string;
  isMurderer:            boolean;
  murderKnowledge:       'full' | 'partial' | 'none' | 'not_applicable';
  status:                'alive' | 'ghost';
  money:                 number;
  messagingCode:         string;
  isGm:                  boolean;
  scenarioCharacterId?:  number | null;
  createdAt?:            Date;
  updatedAt?:            Date;
}

interface GamePlayerCreationAttributes
  extends Optional<GamePlayerAttributes, 'id' | 'userId' | 'scenarioCharacterId'> {}

class GamePlayer
  extends Model<GamePlayerAttributes, GamePlayerCreationAttributes>
  implements GamePlayerAttributes {
  declare id:                  number;
  declare gameId:               number;
  declare userId:               number | null;
  declare characterName:        string;
  declare characterRole:        string;
  declare isMurderer:           boolean;
  declare murderKnowledge:      'full' | 'partial' | 'none' | 'not_applicable';
  declare status:               'alive' | 'ghost';
  declare money:                number;
  declare messagingCode:        string;
  declare isGm:                 boolean;
  declare scenarioCharacterId:  number | null;
  declare createdAt:            Date;
  declare updatedAt:            Date;
}

GamePlayer.init(
  {
    id:                  { type: DataTypes.INTEGER,  autoIncrement: true, primaryKey: true },
    gameId:              { type: DataTypes.INTEGER,  allowNull: false },
    userId:              { type: DataTypes.INTEGER,  allowNull: true },
    characterName:       { type: DataTypes.STRING(60),  allowNull: false },
    characterRole:       { type: DataTypes.TEXT,        allowNull: false },
    isMurderer:          { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: false },
    murderKnowledge:     { type: DataTypes.ENUM('full', 'partial', 'none', 'not_applicable'),
                           allowNull: false, defaultValue: 'not_applicable' },
    status:              { type: DataTypes.ENUM('alive', 'ghost'),
                           allowNull: false, defaultValue: 'alive' },
    money:               { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    messagingCode:       { type: DataTypes.STRING(20), allowNull: false, unique: true },
    isGm:                { type: DataTypes.BOOLEAN,    allowNull: false, defaultValue: false },
    scenarioCharacterId: { type: DataTypes.INTEGER,    allowNull: true },
  },
  { sequelize, tableName: 'game_players', timestamps: true }
);

export default GamePlayer;