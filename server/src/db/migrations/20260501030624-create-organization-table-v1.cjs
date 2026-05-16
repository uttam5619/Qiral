'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.sequelize.query(
    `
    create table organizations(
      organization_id INT AUTO_INCREMENT PRIMARY KEY,
      org_name VARCHAR(255) NOT NULL,
      org_slug VARCHAR(255) UNIQUE NOT NULL,
      org_status VARCHAR(50)
        CHECK (org_status IN ('active','suspended','inactive','deleted')) DEFAULT 'active',
      is_deleted TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )AUTO_INCREMENT = 10001;
    `
   )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('organizations');
    
  }
};
