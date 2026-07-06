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

    await queryInterface.createTable('relesegroups',{
      _id:{type:Sequelize.UUID,defaultValue:Sequelize.literal("NEWID()"),primaryKey: true},
      group_name:{type:Sequelize.STRING,allowNull:false},
      group_department:{type:Sequelize.STRING,allowNull:false},
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });


    await queryInterface.addIndex("relesegroups", ["group_name", "group_department"], {
      unique: true,
      name: "unique_group_name_department",
    });



  },

  async down (queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("relesegroups");
  }
};
