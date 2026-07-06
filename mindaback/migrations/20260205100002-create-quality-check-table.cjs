'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.tableExists('quality_check');
    if (exists) return;

    await queryInterface.createTable('quality_check', {
      _id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('NEWID()'),
        primaryKey: true,
      },
      machine_name: { type: Sequelize.STRING(255), allowNull: true },
      product_name: { type: Sequelize.STRING(255), allowNull: true },
      part_number: { type: Sequelize.STRING(255), allowNull: true },
      company_name: { type: Sequelize.STRING(255), allowNull: true },
      plant_name: { type: Sequelize.STRING(255), allowNull: true },
      status: { type: Sequelize.STRING(50), allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      checked_by: { type: Sequelize.STRING(255), allowNull: true },
      checked_at: { type: Sequelize.DATE, allowNull: true },
      approve_quantity: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      reject_quantity: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('quality_check');
  },
};
