'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE users (
        user_id       INT AUTO_INCREMENT PRIMARY KEY,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name     VARCHAR(255) NOT NULL,
        role          ENUM('admin','engineer','analyst','user') NOT NULL DEFAULT 'user',
        org_id        INT NOT NULL,
        is_deleted    TIMESTAMP NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (org_id) REFERENCES organizations(organization_id) ON DELETE CASCADE
      )
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS users');
  }
};
