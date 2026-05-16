'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS indexes_metadata (
        index_id INT AUTO_INCREMENT PRIMARY KEY,

        org_id INT NOT NULL,
        db_name VARCHAR(255) NOT NULL,

        table_name VARCHAR(255),
        index_name VARCHAR(255),
        column_name VARCHAR(255),

        non_unique BOOLEAN,
        seq_in_index INT,

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
    await queryInterface.dropTable('indexes_metadata');
  }
};
