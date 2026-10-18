import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface GameClueAttributes {
  id: number;
  gameId: number;
  physicalClueId: number;
  currentCharacterId: number | null;
  isFalsified: boolean;
  falsifiedByPlayerId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GameClueCreationAttributes extends Optional<
  GameClueAttributes,
  "id" | "currentCharacterId" | "isFalsified" | "falsifiedByPlayerId"
> {}

class GameClue
  extends Model<GameClueAttributes, GameClueCreationAttributes>
  implements GameClueAttributes
{
  declare id: number;
  declare gameId: number;
  declare physicalClueId: number;
  declare currentCharacterId: number | null;
  declare isFalsified: boolean;
  declare falsifiedByPlayerId: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

GameClue.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    physicalClueId: { type: DataTypes.INTEGER, allowNull: false },
    currentCharacterId: { type: DataTypes.INTEGER, allowNull: true },
    isFalsified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    falsifiedByPlayerId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: "game_clues", timestamps: true },
);

export default GameClue;
