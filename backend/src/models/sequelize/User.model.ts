import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface UserAttributes {
  id:           number;
  username:     string;
  email:        string;
  passwordHash: string;
  createdAt?:   Date;
  updatedAt?:   Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  declare id:           number;
  declare username:     string;
  declare email:        string;
  declare passwordHash: string;
  declare createdAt:    Date;
  declare updatedAt:    Date;
}

User.init(
  {
    id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username:     { type: DataTypes.STRING(30), allowNull: false, unique: true },
    email:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  },
  {
    sequelize,
    tableName:  'users',
    timestamps: true,
  }
);

export default User;