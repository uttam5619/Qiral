import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Database = sequelize.define('Database', {
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
  host: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 3306,
  },
  db_username: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  db_password: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  db_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'MYSQL',
    validate: {
      isIn: [['MYSQL', 'POSTGRESQL']],
    },
  },
  is_deleted: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'db',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Database;
