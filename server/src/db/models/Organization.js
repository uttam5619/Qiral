import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const Organization = sequelize.define('Organization', {
  organization_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  org_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  org_slug: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
  },
  org_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'suspended', 'inactive', 'deleted']],
    },
  },
  is_deleted: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'organizations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Organization;
