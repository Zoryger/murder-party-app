import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface TimedEffectAttributes {
  id: number;
  gameId: number;
  type: "blackout" | "inversion";
  createdBy: number; // le GamePlayer qui a déclenché l'effet
  player1Id: number | null; // inversion : les deux joueurs dont les codes sont échangés
  player2Id: number | null;
  endsAt: Date;
  cancelledAt: Date | null;
  createdAt?: Date;
}

interface TimedEffectCreationAttributes extends Optional<
  TimedEffectAttributes,
  "id" | "player1Id" | "player2Id" | "cancelledAt"
> {}

class TimedEffect
  extends Model<TimedEffectAttributes, TimedEffectCreationAttributes>
  implements TimedEffectAttributes
{
  declare id: number;
  declare gameId: number;
  declare type: "blackout" | "inversion";
  declare createdBy: number;
  declare player1Id: number | null;
  declare player2Id: number | null;
  declare endsAt: Date;
  declare cancelledAt: Date | null;
  declare createdAt: Date;
}

TimedEffect.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM("blackout", "inversion"), allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    player1Id: { type: DataTypes.INTEGER, allowNull: true },
    player2Id: { type: DataTypes.INTEGER, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: false },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "timed_effects", timestamps: true, updatedAt: false },
);

export default TimedEffect;
