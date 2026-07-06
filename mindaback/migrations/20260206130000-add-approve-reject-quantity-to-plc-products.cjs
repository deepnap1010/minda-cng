'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('plc_products');
    if (!tableDescription.approve_quantity) {
      await queryInterface.addColumn('plc_products', 'approve_quantity', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }
    if (!tableDescription.reject_quantity) {
      await queryInterface.addColumn('plc_products', 'reject_quantity', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('plc_products');
    if (tableDescription.approve_quantity) {
      await queryInterface.removeColumn('plc_products', 'approve_quantity');
    }
    if (tableDescription.reject_quantity) {
      await queryInterface.removeColumn('plc_products', 'reject_quantity');
    }
  },
};
