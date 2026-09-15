import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface ConversationAttributes {
  id:         number;
  gameId:     number;
  player1Id:  number;
  player2Id:  number;
  isFake:     boolean;
  createdBy:  number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationCreationAttributes
  extends Optional<ConversationAttributes, 'id' | 'isFake' | 'createdBy'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes {
  declare id:         number;
  declare gameId:     number;
  declare player1Id:  number;
  declare player2Id:  number;
  declare isFake:     boolean;
  declare createdBy:  number | null;
  declare createdAt:  Date;
  declare updatedAt:  Date;
}

Conversation.init(
  {
    id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId:    { type: DataTypes.INTEGER, allowNull: false },
    player1Id: { type: DataTypes.INTEGER, allowNull: false },
    player2Id: { type: DataTypes.INTEGER, allowNull: false },
    isFake:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'conversations', timestamps: true }
);

export default Conversation;