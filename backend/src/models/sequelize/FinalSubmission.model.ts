import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface FinalSubmissionAttributes {
  id: number;
  gameId: number;
  playerId: number;
  weapon: string; // arme / mode opératoire
  subplots: string; // intrigues secondaires et lore reconstitués
  objectiveNotes: string; // notes sur l'objectif personnel (ex. Dylan)
  createdAt?: Date;
  updatedAt?: Date;
}

interface FinalSubmissionCreationAttributes extends Optional<
  FinalSubmissionAttributes,
  "id"
> {}

class FinalSubmission
  extends Model<FinalSubmissionAttributes, FinalSubmissionCreationAttributes>
  implements FinalSubmissionAttributes
{
  declare id: number;
  declare gameId: number;
  declare playerId: number;
  declare weapon: string;
  declare subplots: string;
  declare objectiveNotes: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

FinalSubmission.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    playerId: { type: DataTypes.INTEGER, allowNull: false },
    weapon: { type: DataTypes.TEXT, allowNull: false },
    subplots: { type: DataTypes.TEXT, allowNull: false },
    objectiveNotes: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    sequelize,
    tableName: "final_submissions",
    timestamps: true,
    // Un seul formulaire par joueur et par partie
    indexes: [
      {
        name: "uniq_final_player",
        unique: true,
        fields: ["gameId", "playerId"],
      },
    ],
  },
);

export default FinalSubmission;
