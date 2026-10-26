import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface ClueUnlockAttributes {
  id: number;
  gameId: number;
  gamePlayerId: number;
  cluePasswordId: number | null;
  createdAt?: Date;
}

interface ClueUnlockCreationAttributes
  extends Optional<ClueUnlockAttributes, "id"> {}

class ClueUnlock
  extends Model<ClueUnlockAttributes, ClueUnlockCreationAttributes>
  implements ClueUnlockAttributes
{
  declare id: number;
  declare gameId: number;
  declare gamePlayerId: number;
  declare cluePasswordId: number | null;
  declare createdAt: Date;
}

ClueUnlock.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    gamePlayerId: { type: DataTypes.INTEGER, allowNull: false },
    cluePasswordId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: "clue_unlocks",
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: "uniq_clue_unlock",
        unique: true,
        fields: ["gamePlayerId", "cluePasswordId"],
      },
    ],
  },
);

export default ClueUnlock;
