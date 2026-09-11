import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

interface PowerAttributes {
  id:              number;
  name:            string;
  slug:            string;
  category:        'info' | 'manipulation' | 'social' | 'life' | 'economy';
  description:     string;
  maxUses:         number;
  durationSeconds: number | null;
  createdAt?:      Date;
  updatedAt?:      Date;
}

interface PowerCreationAttributes extends Optional<PowerAttributes, 'id' | 'durationSeconds'> {}

class Power extends Model<PowerAttributes, PowerCreationAttributes>
  implements PowerAttributes {
  declare id:              number;
  declare name:            string;
  declare slug:            string;
  declare category:        'info' | 'manipulation' | 'social' | 'life' | 'economy';
  declare description:     string;
  declare maxUses:         number;
  declare durationSeconds: number | null;
}

Power.init(
  {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:        { type: DataTypes.STRING(60),  allowNull: false },
    slug:        { type: DataTypes.STRING(60),  allowNull: false, unique: true },
    category:    { type: DataTypes.ENUM('info', 'manipulation', 'social', 'life', 'economy'),
                   allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    maxUses:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName:  'powers',
    timestamps: true,
  }
);

export default Power;