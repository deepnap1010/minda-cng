'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.createTable('documents', {
      _id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("NEWID()"), primaryKey: true },
      doc_name: { type: Sequelize.STRING, allowNull: false },
      category: { type: Sequelize.STRING, allowNull: false },
      expiry: { type: Sequelize.DATE, allowNull: true },
      attached_doc: { type: Sequelize.STRING, allowNull: true }
    });
  },

  async down(queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('documents');
  }
};
