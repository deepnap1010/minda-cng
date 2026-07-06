'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('plc_products');
    if (!tableExists) return;

    const desc = await queryInterface.describeTable('plc_products');
    const addIfMissing = async (col, def) => {
      if (!desc[col]) {
        await queryInterface.addColumn('plc_products', col, def);
      }
    };

    await addIfMissing('company_name', { type: Sequelize.STRING(255), allowNull: true });
    await addIfMissing('plant_name', { type: Sequelize.STRING(255), allowNull: true });
    await addIfMissing('product_name', { type: Sequelize.STRING(255), allowNull: true });
  },

  async down(queryInterface) {
    const desc = await queryInterface.describeTable('plc_products');
    const cols = ['company_name', 'plant_name', 'product_name'];
    for (const col of cols) {
      if (desc[col]) await queryInterface.removeColumn('plc_products', col);
    }
  },
};
