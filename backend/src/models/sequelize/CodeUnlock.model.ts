import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface CodeUnlockAttributes {
  id:                  number;
  gameId:              number;
  unlockedByPlayerId:  number;
  targetPlayerId:      number;
  createdAt?:          Date;
}

interface CodeUnlockCreationAttributes extends Optional<CodeUnlockAttributes, 'id'> {}

class CodeUnlock extends Model<CodeUnlockAttributes, CodeUnlockCreationAttributes>
  implements CodeUnlockAttributes {
  declare id:                 number;
  declare gameId:             number;
  declare unlockedByPlayerId: number;
  declare targetPlayerId:     number;
  declare createdAt:          Date;
}

CodeUnlock.init(
  {
    id:                 { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId:             { type: DataTypes.INTEGER, allowNull: false },
    unlockedByPlayerId: { type: DataTypes.INTEGER, allowNull: false },
    targetPlayerId:     { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'code_unlocks',
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['unlockedByPlayerId', 'targetPlayerId'] }],
  }
);

export default CodeUnlock;