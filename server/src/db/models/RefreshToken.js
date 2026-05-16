import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING(512),
    allowNull: false,
    unique: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  is_revoked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'refresh_tokens',
  timestamps: false,   // we handle created_at manually above
});

export default RefreshToken;
