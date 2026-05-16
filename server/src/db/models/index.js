import sequelize from '../../config/db.js';
import Organization from './Organization.js';
import Database from './Database.js';
import TableList from './TableList.js';
import ColumnList from './ColumnList.js';
import Relationship from './Relationship.js';
import IndexMetadata from './IndexMetadata.js';
import User from './User.js';
import RefreshToken from './RefreshToken.js';

// ── Associations ──

// Organization → Database
Organization.hasMany(Database, { foreignKey: 'org_id', as: 'databases' });
Database.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });

// Organization → TableList
Organization.hasMany(TableList, { foreignKey: 'org_id', as: 'tables' });
TableList.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });

// Organization → ColumnList
Organization.hasMany(ColumnList, { foreignKey: 'org_id', as: 'columns' });
ColumnList.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });

// Organization → Relationship
Organization.hasMany(Relationship, { foreignKey: 'org_id', as: 'relationships' });
Relationship.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });

// Organization → IndexMetadata
Organization.hasMany(IndexMetadata, { foreignKey: 'org_id', as: 'indexes' });
IndexMetadata.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });

// Organization → User
Organization.hasMany(User, { foreignKey: 'org_id', as: 'users' });
User.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });

// User → RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  sequelize,
  Organization,
  Database,
  TableList,
  ColumnList,
  Relationship,
  IndexMetadata,
  User,
  RefreshToken,
};
