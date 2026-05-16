'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add password reset fields to users table
    await queryInterface.sequelize.query(`
      ALTER TABLE users
        ADD COLUMN reset_token       VARCHAR(255) NULL AFTER is_deleted,
        ADD COLUMN reset_token_expires TIMESTAMP  NULL AFTER reset_token
    `);

    // 2. Create refresh_tokens table
    await queryInterface.sequelize.query(`
      CREATE TABLE refresh_tokens (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        token       VARCHAR(512) NOT NULL UNIQUE,
        expires_at  TIMESTAMP NOT NULL,
        is_revoked  TINYINT(1) NOT NULL DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS refresh_tokens');
    await queryInterface.sequelize.query(`
      ALTER TABLE users
        DROP COLUMN reset_token,
        DROP COLUMN reset_token_expires
    `);
  }
};
