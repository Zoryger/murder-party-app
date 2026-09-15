import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface MessageAttributes {
  id:             number;
  conversationId: number;
  senderId:       number;
  content:        string;
  createdAt?:     Date;
  updatedAt?:     Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes {
  declare id:             number;
  declare conversationId: number;
  declare senderId:       number;
  declare content:        string;
  declare createdAt:      Date;
  declare updatedAt:      Date;
}

Message.init(
  {
    id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    conversationId: { type: DataTypes.INTEGER, allowNull: false },
    senderId:       { type: DataTypes.INTEGER, allowNull: false },
    content:        { type: DataTypes.TEXT,    allowNull: false },
  },
  { sequelize, tableName: 'messages', timestamps: true }
);

export default Message;