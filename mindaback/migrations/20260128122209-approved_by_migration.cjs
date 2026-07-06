'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // approved_by is already added by 20260124130000-add-approved-by-to-workflow-approvals.
    // This migration is a no-op to avoid "Column name 'approved_by' specified more than once".
  },

  async down(queryInterface) {
    // No-op: approved_by is owned by 20260124130000.
  },
};
