import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface FinalAccusationAttributes {
  id:               number;
  submissionId:     number;
  accusedPlayerId:  number;
  mobile:           string;
}

interface FinalAccusationCreationAttributes extends Optional<FinalAccusationAttributes, 'id'> {}

class FinalAccusation extends Model<FinalAccusationAttributes, FinalAccusationCreationAttributes>
  implements FinalAccusationAttributes {
  declare id:              number;
  declare submissionId:    number;
  declare accusedPlayerId: number;
  declare mobile:          string;
}

FinalAccusation.init(
  {
    id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    submissionId:    { type: DataTypes.INTEGER, allowNull: false },
    accusedPlayerId: { type: DataTypes.INTEGER, allowNull: false },
    mobile:          { type: DataTypes.TEXT, allowNull: false },
  },
  {
    sequelize,
    tableName:  'final_accusations',
    timestamps: false,
    indexes: [{ name: 'uniq_accusation', unique: true, fields: ['submissionId', 'accusedPlayerId'] }],
  }
);

export default FinalAccusation;