'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('quality_check');
    if (!tableDescription.approve_quantity) {
      await queryInterface.addColumn('quality_check', 'approve_quantity', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }
    if (!tableDescription.reject_quantity) {
      await queryInterface.addColumn('quality_check', 'reject_quantity', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('quality_check');
    if (tableDescription.approve_quantity) {
      await queryInterface.removeColumn('quality_check', 'approve_quantity');
    }
    if (tableDescription.reject_quantity) {
      await queryInterface.removeColumn('quality_check', 'reject_quantity');
    }
  },
};
