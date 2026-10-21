import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface DuelAttributes {
  id: number;
  gameId: number;
  createdBy: number;
  challenger1Id: number;
  challenger2Id: number;
  status: "joust" | "voting" | "finished" | "cancelled";
  joustEndsAt: Date;
  votingEndsAt: Date;
  loserId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DuelCreationAttributes extends Optional<
  DuelAttributes,
  "id" | "status" | "loserId"
> {}

class Duel
  extends Model<DuelAttributes, DuelCreationAttributes>
  implements DuelAttributes
{
  declare id: number;
  declare gameId: number;
  declare createdBy: number;
  declare challenger1Id: number;
  declare challenger2Id: number;
  declare status: "joust" | "voting" | "finished" | "cancelled";
  declare joustEndsAt: Date;
  declare votingEndsAt: Date;
  declare loserId: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Duel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    challenger1Id: { type: DataTypes.INTEGER, allowNull: false },
    challenger2Id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("joust", "voting", "finished", "cancelled"),
      allowNull: false,
      defaultValue: "joust",
    },
    joustEndsAt: { type: DataTypes.DATE, allowNull: false },
    votingEndsAt: { type: DataTypes.DATE, allowNull: false },
    loserId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: "duels", timestamps: true },
);

export default Duel;
