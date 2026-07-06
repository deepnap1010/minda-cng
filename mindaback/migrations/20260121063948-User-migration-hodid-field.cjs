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

    // Check if column already exists
    try {
      const tableDescription = await queryInterface.describeTable("users");
      if (tableDescription.hod_id) {
        console.log("Column hod_id already exists, skipping migration");
        return;
      }
    } catch (error) {
      // Table might not exist or other error, continue with migration
      console.log("Could not check table description:", error.message);
    }

    // Add hod_id column
    await queryInterface.addColumn("users", "hod_id", {
      type: Sequelize.UUID,
      allowNull: true
    });

    // Add foreign key constraint using raw SQL (more reliable for SQL Server)
    await queryInterface.sequelize.query(`
      IF NOT EXISTS (
        SELECT * FROM sys.foreign_keys 
        WHERE name = 'FK_users_hod_id' 
        AND parent_object_id = OBJECT_ID('users')
      )
      BEGIN
        ALTER TABLE users
        ADD CONSTRAINT FK_users_hod_id 
        FOREIGN KEY (hod_id) 
        REFERENCES users(_id) 
        ON DELETE SET NULL;
      END
    `);

    // Add index for better query performance
    await queryInterface.addIndex("users", ["hod_id"], {
      name: "IX_users_hod_id"
    });
  },

  async down (queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    
    // Remove index first
    try {
      await queryInterface.removeIndex("users", "IX_users_hod_id");
    } catch (error) {
      console.log("Index might not exist:", error.message);
    }

    // Remove foreign key constraint using raw SQL
    try {
      await queryInterface.sequelize.query(`
        IF EXISTS (
          SELECT * FROM sys.foreign_keys 
          WHERE name = 'FK_users_hod_id' 
          AND parent_object_id = OBJECT_ID('users')
        )
        BEGIN
          ALTER TABLE users DROP CONSTRAINT FK_users_hod_id;
        END
      `);
    } catch (error) {
      console.log("Constraint might not exist:", error.message);
    }

    // Remove column
    await queryInterface.removeColumn("users", "hod_id");
  }
};
