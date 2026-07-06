'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.tableExists('plc_products');
    if (exists) return;

    await queryInterface.createTable('plc_products', {
      _id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('NEWID()'),
        primaryKey: true,
      },
      material_code: { type: Sequelize.STRING(255), allowNull: true },
      material_description: { type: Sequelize.TEXT, allowNull: true },
      part_no: { type: Sequelize.STRING(255), allowNull: true },
      model_code: { type: Sequelize.STRING(255), allowNull: true },
      machine_name: { type: Sequelize.STRING(255), allowNull: true },
      company_name: { type: Sequelize.STRING(255), allowNull: true },
      plant_name: { type: Sequelize.STRING(255), allowNull: true },
      product_name: { type: Sequelize.STRING(255), allowNull: true },
      approve_quantity: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      reject_quantity: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('plc_products');
  },
};
