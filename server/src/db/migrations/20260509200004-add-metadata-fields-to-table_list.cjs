'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE table_list
        ADD COLUMN table_type VARCHAR(255),
        ADD COLUMN engine VARCHAR(255),
        ADD COLUMN table_rows BIGINT`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE table_list
        DROP COLUMN table_type,
        DROP COLUMN engine,
        DROP COLUMN table_rows`
    );
  }
};
