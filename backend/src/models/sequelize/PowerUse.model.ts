import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface PowerUseAttributes {
  id:              number;
  gameId:          number;
  gamePlayerId:    number;
  powerSlug:       string;
  targetPlayerId:  number | null;
  targetPlayerId2: number | null;
  conversationId:  number | null;
  payload:         string | null;
  createdAt?:      Date;
}

interface PowerUseCreationAttributes
  extends Optional<PowerUseAttributes, 'id' | 'targetPlayerId' | 'targetPlayerId2' | 'conversationId' | 'payload'> {}

class PowerUse extends Model<PowerUseAttributes, PowerUseCreationAttributes>
  implements PowerUseAttributes {
  declare id:              number;
  declare gameId:          number;
  declare gamePlayerId:    number;
  declare powerSlug:       string;
  declare targetPlayerId:  number | null;
  declare targetPlayerId2: number | null;
  declare conversationId:  number | null;
  declare payload:         string | null;
  declare createdAt:       Date;
}

PowerUse.init(
  {
    id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId:          { type: DataTypes.INTEGER, allowNull: false },
    gamePlayerId:    { type: DataTypes.INTEGER, allowNull: false },
    powerSlug:       { type: DataTypes.STRING(60), allowNull: false },
    targetPlayerId:  { type: DataTypes.INTEGER, allowNull: true },
    targetPlayerId2: { type: DataTypes.INTEGER, allowNull: true },
    conversationId:  { type: DataTypes.INTEGER, allowNull: true },
    payload:         { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'power_uses', timestamps: true, updatedAt: false }
);

export default PowerUse;