import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

interface GhostSubstitutionAttributes {
  id: number;
  gameId: number;
  holderPlayerId: number; // le porteur de l'Horcruxe
  substitutePlayerId: number; // le joueur devenu fantôme à sa place
  isActive: boolean;
  deactivatedAt: Date | null;
  createdAt?: Date;
}

interface GhostSubstitutionCreationAttributes extends Optional<
  GhostSubstitutionAttributes,
  "id" | "isActive" | "deactivatedAt"
> {}

class GhostSubstitution
  extends Model<
    GhostSubstitutionAttributes,
    GhostSubstitutionCreationAttributes
  >
  implements GhostSubstitutionAttributes
{
  declare id: number;
  declare gameId: number;
  declare holderPlayerId: number;
  declare substitutePlayerId: number;
  declare isActive: boolean;
  declare deactivatedAt: Date | null;
  declare createdAt: Date;
}

GhostSubstitution.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gameId: { type: DataTypes.INTEGER, allowNull: false },
    holderPlayerId: { type: DataTypes.INTEGER, allowNull: false },
    substitutePlayerId: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deactivatedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "ghost_substitutions",
    timestamps: true,
    updatedAt: false,
  },
);

export default GhostSubstitution;
