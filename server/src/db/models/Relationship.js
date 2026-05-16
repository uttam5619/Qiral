import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Relationship = sequelize.define('Relationship', {
  relationship_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  org_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  db_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  constraint_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  source_table: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  source_column: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  target_table: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  target_column: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  update_rule: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  delete_rule: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'relationships',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Relationship;
