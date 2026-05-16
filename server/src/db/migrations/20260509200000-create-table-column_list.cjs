'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS column_list (
        column_name VARCHAR(255) NOT NULL,
        table_name VARCHAR(255) NOT NULL,
        db_name VARCHAR(255) NOT NULL,
        org_id INT NOT NULL,

        data_type VARCHAR(255),
        column_type VARCHAR(255),
        is_nullable BOOLEAN DEFAULT TRUE,
        column_key VARCHAR(50),
        extra_info VARCHAR(255),
        ordinal_position INT,

        is_deleted TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (column_name, table_name, db_name, org_id),
        FOREIGN KEY (org_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
        FOREIGN KEY (table_name, db_name, org_id) REFERENCES table_list(table_name, db_name, org_id) ON DELETE CASCADE
      )
      `
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('column_list');
  }
};
