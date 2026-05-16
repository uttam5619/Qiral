import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

/**
 * User model.
 * NOTE: underscored is NOT used here because we explicitly define all
 * snake_case column names ourselves — mixing both causes Sequelize to
 * generate duplicate/wrong column mappings (e.g. created_at → created_at_at).
 */
const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'engineer', 'analyst', 'user'),
    allowNull: false,
    defaultValue: 'user',
  },
  org_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  is_deleted: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'users',
  timestamps: true,           // let Sequelize manage timestamps…
  createdAt: 'created_at',    // …but map them to snake_case columns
  updatedAt: 'updated_at',
  underscored: false,         // do NOT auto-convert camelCase fields
});

export default User;
