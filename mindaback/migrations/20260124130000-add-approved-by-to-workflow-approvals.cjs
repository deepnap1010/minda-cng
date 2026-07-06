'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('workflow_approvals');
    
    if (!tableDescription.approved_by) {
      // Add approved_by column
      await queryInterface.addColumn('workflow_approvals', 'approved_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: '_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Add index for better query performance
      await queryInterface.addIndex('workflow_approvals', ['approved_by'], {
        name: 'IX_workflow_approvals_approved_by'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    const tableDescription = await queryInterface.describeTable('workflow_approvals');
    
    if (tableDescription.approved_by) {
      // Check if index exists before dropping
      const [results] = await queryInterface.sequelize.query(`
        SELECT name FROM sys.indexes 
        WHERE object_id = OBJECT_ID('workflow_approvals') 
        AND name = 'IX_workflow_approvals_approved_by'
      `);
      
      if (results.length > 0) {
        await queryInterface.removeIndex('workflow_approvals', 'IX_workflow_approvals_approved_by');
      }

      // Remove column
      await queryInterface.removeColumn('workflow_approvals', 'approved_by');
    }
  }
};
