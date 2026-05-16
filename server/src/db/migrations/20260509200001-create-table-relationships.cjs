'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS relationships (
        relationship_id INT AUTO_INCREMENT PRIMARY KEY,

        org_id INT NOT NULL,
        db_name VARCHAR(255) NOT NULL,

        constraint_name VARCHAR(255),

        source_table VARCHAR(255),
        source_column VARCHAR(255),

        target_table VARCHAR(255),
        target_column VARCHAR(255),

        update_rule VARCHAR(255),
        delete_rule VARCHAR(255),

        is_deleted TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (org_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
        FOREIGN KEY (db_name, org_id) REFERENCES db(db_name, org_id) ON DELETE CASCADE
      )
      `
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('relationships');
  }
};
