'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

       await queryInterface.createTable('group_user', {
      _id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('NEWID()'),
        primaryKey: true,
        allowNull: false
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',   // user table name
          key: '_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      plants_id: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      relese_group_id:{type:Sequelize.UUID,allowNull:false, references:{model:"relesegroups",key:"_id"},  onUpdate: 'CASCADE',
        onDelete: 'CASCADE'},
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
  },

  async down (queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.dropTable("group_user")
  }
};
