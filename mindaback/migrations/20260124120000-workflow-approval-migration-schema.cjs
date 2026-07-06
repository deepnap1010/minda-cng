'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workflow_approvals', {
      _id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('NEWID()'),
        primaryKey: true,
        allowNull: false
      },
      current_stage: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      reassign_stage: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      workflow_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workflows',
          key: '_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: '_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      template_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'template_masters',
          key: '_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('GETDATE()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('GETDATE()')
      }
    });

    await queryInterface.addIndex('workflow_approvals', ['workflow_id'], {
      name: 'workflow_approvals_workflow_id_index'
    });

    await queryInterface.addIndex('workflow_approvals', ['template_id'], {
      name: 'workflow_approvals_template_id_index'
    });

    await queryInterface.addIndex('workflow_approvals', ['user_id'], {
      name: 'workflow_approvals_user_id_index'
    });

    await queryInterface.addIndex('workflow_approvals', ['status'], {
      name: 'workflow_approvals_status_index'
    });

    await queryInterface.addIndex('workflow_approvals', ['template_id', 'current_stage'], {
      name: 'workflow_approvals_template_stage_index'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workflow_approvals');
  }
};
