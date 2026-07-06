'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('plc_data');
    if (!tableExists) return;

    const desc = await queryInterface.describeTable('plc_data');
    const addIfMissing = async (col, def) => {
      if (!desc[col]) {
        await queryInterface.addColumn('plc_data', col, def);
      }
    };

    await addIfMissing('company_name', { type: Sequelize.STRING(255), allowNull: true });
    await addIfMissing('plant_name', { type: Sequelize.STRING(255), allowNull: true });
    await addIfMissing('line_number', { type: Sequelize.STRING(50), allowNull: true });
    await addIfMissing('device_id', { type: Sequelize.STRING(255), allowNull: true });
    await addIfMissing('timestamp', { type: Sequelize.DATE, allowNull: true });
    await addIfMissing('start_time', { type: Sequelize.DATE, allowNull: true });
    await addIfMissing('stop_time', { type: Sequelize.DATE, allowNull: true });
    await addIfMissing('status', { type: Sequelize.STRING(255), allowNull: true });
    await addIfMissing('alarm', { type: Sequelize.STRING(255), allowNull: true });
    await addIfMissing('extra_data', { type: Sequelize.TEXT, allowNull: true });
  },

  async down(queryInterface) {
    const desc = await queryInterface.describeTable('plc_data');
    const cols = ['company_name', 'plant_name', 'line_number', 'device_id', 'timestamp', 'start_time', 'stop_time', 'status', 'alarm', 'extra_data'];
    for (const col of cols) {
      if (desc[col]) await queryInterface.removeColumn('plc_data', col);
    }
  },
};
