import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface LoveBondAttributes {
  id: number;
  gameId: number;
  player1Id: number;
  player2Id: number;
  createdBy: number; // le joueur Cupidon
  createdAt?: Date;
}

interface LoveBondCreationAttributes extends Optional<
  LoveBondAttributes,
  "id"
> {}

class LoveBond
  extends Model<LoveBondAttributes, LoveBondCreationAttributes>
  implements LoveBondAttributes
{
  declare id: number;
  declare gameId: number;
  declare player1Id: number;
  declare player2Id: number;
  declare createdBy: number;
  declare createdAt: Date;
}

LoveBond.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    player1Id: { type: DataTypes.INTEGER, allowNull: false },
    player2Id: { type: DataTypes.INTEGER, allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "love_bonds", timestamps: true, updatedAt: false },
);

export default LoveBond;
