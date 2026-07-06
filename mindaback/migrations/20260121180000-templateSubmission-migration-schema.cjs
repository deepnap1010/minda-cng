'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('template_submissions', {
      _id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('NEWID()'),
        primaryKey: true,
        allowNull: false
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
      form_data: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'DRAFT'
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

    await queryInterface.addIndex('template_submissions', ['template_id'], {
      name: 'template_submissions_template_id_index'
    });

    await queryInterface.addIndex('template_submissions', ['user_id'], {
      name: 'template_submissions_user_id_index'
    });

    await queryInterface.addIndex('template_submissions', ['status'], {
      name: 'template_submissions_status_index'
    });

    await queryInterface.addIndex('template_submissions', ['template_id', 'user_id'], {
      name: 'template_submissions_template_user_index'
    });
  },

  async down (queryInterface) {
    await queryInterface.dropTable('template_submissions');
  }
};
