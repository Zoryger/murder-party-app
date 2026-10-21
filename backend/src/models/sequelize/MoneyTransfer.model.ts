import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface MoneyTransferAttributes {
  id: number;
  gameId: number;
  fromPlayerId: number;
  toPlayerId: number;
  amount: number;
  createdAt?: Date;
}

interface MoneyTransferCreationAttributes extends Optional<
  MoneyTransferAttributes,
  "id"
> {}

class MoneyTransfer
  extends Model<MoneyTransferAttributes, MoneyTransferCreationAttributes>
  implements MoneyTransferAttributes
{
  declare id: number;
  declare gameId: number;
  declare fromPlayerId: number;
  declare toPlayerId: number;
  declare amount: number;
  declare createdAt: Date;
}

MoneyTransfer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    fromPlayerId: { type: DataTypes.INTEGER, allowNull: false },
    toPlayerId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: "money_transfers",
    timestamps: true,
    updatedAt: false,
  },
);

export default MoneyTransfer;
