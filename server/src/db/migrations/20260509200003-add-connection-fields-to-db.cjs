'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE db
        ADD COLUMN host VARCHAR(255) DEFAULT '127.0.0.1',
        ADD COLUMN port INT DEFAULT 3306,
        ADD COLUMN db_username VARCHAR(255),
        ADD COLUMN db_password TEXT,
        ADD COLUMN db_type VARCHAR(50) DEFAULT 'MYSQL'`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE db
        DROP COLUMN host,
        DROP COLUMN port,
        DROP COLUMN db_username,
        DROP COLUMN db_password,
        DROP COLUMN db_type`
    );
  }
};
