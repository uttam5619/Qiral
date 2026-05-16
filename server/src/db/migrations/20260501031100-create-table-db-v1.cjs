'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `
      create table db(
        db_name VARCHAR(255) NOT NULL,
        org_id INT NOT NULL,
        is_deleted TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (db_name, org_id),
        FOREIGN KEY (org_id) REFERENCES organizations(organization_id) ON DELETE CASCADE
      )
      `
    )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('db');
    
  }
};
