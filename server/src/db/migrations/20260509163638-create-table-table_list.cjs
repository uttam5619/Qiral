'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS table_list (
        table_name VARCHAR(255) NOT NULL,
        db_name VARCHAR(255) NOT NULL,
        org_id INT NOT NULL,
        is_deleted TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (table_name, db_name, org_id),
        FOREIGN KEY (org_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
        FOREIGN KEY (db_name, org_id) REFERENCES db(db_name, org_id) ON DELETE CASCADE
      )

      `
    )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('table_list');
  }
};
