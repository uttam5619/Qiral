import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const TableList = sequelize.define('TableList', {
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
  table_type: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  engine: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  table_rows: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'table_list',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default TableList;
