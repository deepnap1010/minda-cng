'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('workflow_approvals', 'reassign_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: '_id',
      },
    });

    await queryInterface.addColumn('workflow_approvals', 'reassign_status', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('workflow_approvals', 'reassign_user_id');
    await queryInterface.removeColumn('workflow_approvals', 'reassign_status');
  },
};
