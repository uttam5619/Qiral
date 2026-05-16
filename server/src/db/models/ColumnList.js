import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const ColumnList = sequelize.define('ColumnList', {
  column_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    primaryKey: true,
  },
  table_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    primaryKey: true,
  },
  db_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    primaryKey: true,
  },
  org_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  data_type: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  column_type: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  is_nullable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  column_key: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  extra_info: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ordinal_position: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'column_list',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default ColumnList;
