import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const IndexMetadata = sequelize.define('IndexMetadata', {
  index_id: {
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
  table_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  index_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  column_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  non_unique: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  seq_in_index: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'indexes_metadata',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default IndexMetadata;
