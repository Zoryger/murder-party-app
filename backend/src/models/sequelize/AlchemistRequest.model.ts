import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface AlchemistRequestAttributes {
  id: number;
  gameId: number;
  playerId: number; // le GamePlayer qui pose la question
  question: string;
  cost: number;
  status: "pending" | "answered" | "refused";
  answer: "yes" | "no" | null;
  answeredAt: Date | null;
  createdAt?: Date;
}

interface AlchemistRequestCreationAttributes extends Optional<
  AlchemistRequestAttributes,
  "id" | "status" | "answer" | "answeredAt"
> {}

class AlchemistRequest
  extends Model<AlchemistRequestAttributes, AlchemistRequestCreationAttributes>
  implements AlchemistRequestAttributes
{
  declare id: number;
  declare gameId: number;
  declare playerId: number;
  declare question: string;
  declare cost: number;
  declare status: "pending" | "answered" | "refused";
  declare answer: "yes" | "no" | null;
  declare answeredAt: Date | null;
  declare createdAt: Date;
}

AlchemistRequest.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    playerId: { type: DataTypes.INTEGER, allowNull: false },
    question: { type: DataTypes.TEXT, allowNull: false },
    cost: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "answered", "refused"),
      allowNull: false,
      defaultValue: "pending",
    },
    answer: { type: DataTypes.ENUM("yes", "no"), allowNull: true },
    answeredAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "alchemist_requests",
    timestamps: true,
    updatedAt: false,
  },
);

export default AlchemistRequest;
