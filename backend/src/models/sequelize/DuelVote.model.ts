import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface DuelVoteAttributes {
  id: number;
  duelId: number;
  voterId: number;
  votedForId: number;
  createdAt?: Date;
}

interface DuelVoteCreationAttributes extends Optional<
  DuelVoteAttributes,
  "id"
> {}

class DuelVote
  extends Model<DuelVoteAttributes, DuelVoteCreationAttributes>
  implements DuelVoteAttributes
{
  declare id: number;
  declare duelId: number;
  declare voterId: number;
  declare votedForId: number;
  declare createdAt: Date;
}

DuelVote.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    duelId: { type: DataTypes.INTEGER, allowNull: false },
    voterId: { type: DataTypes.INTEGER, allowNull: false },
    votedForId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: "duel_votes",
    timestamps: true,
    updatedAt: false,
    // Un seul vote par joueur et par duel, garanti par la base elle-même
    indexes: [
      { name: "uniq_duel_voter", unique: true, fields: ["duelId", "voterId"] },
    ],
  },
);

export default DuelVote;
