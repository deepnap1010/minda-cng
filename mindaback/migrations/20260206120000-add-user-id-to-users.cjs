'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.user_id) {
      return; // Column already exists, skip
    }
    await queryInterface.addColumn('users', 'user_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true
    });
  },

  async down (queryInterface) {
    const tableDescription = await queryInterface.describeTable('users');
    if (!tableDescription.user_id) return;
    await queryInterface.removeColumn('users', 'user_id');
  }
};
