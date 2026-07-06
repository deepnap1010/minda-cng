"use strict";

/**
 * Creates the `production_logs` table.
 *
 * Why this exists: the app already ships ProductionLogsModel +
 * productionLogs.service.js + productionLogs.controller.js, but NO migration
 * ever created the table. On production (and likely localhost) the table is
 * missing, so every call to the production-logs endpoints throws
 * "Cannot find the object dbo.production_logs" — which is what showed up in
 * the pm2 error logs.
 *
 * Columns mirror src/models/productionLogs.model.js exactly (timestamps:false).
 * Indexes are created up front so the listing/summary queries
 * (WHERE user_id ORDER BY date_time DESC, plus the summary aggregate) are
 * index-served from day one.
 *
 * Run with:  npx sequelize-cli db:migrate
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface
      .describeTable("production_logs")
      .then(() => true)
      .catch(() => false);

    if (!tableExists) {
      await queryInterface.createTable("production_logs", {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        company_name: { type: Sequelize.STRING(255), allowNull: true },
        code: { type: Sequelize.INTEGER, allowNull: true },
        part_no: { type: Sequelize.STRING(255), allowNull: true },
        qty: { type: Sequelize.INTEGER, allowNull: true },
        new_part_no: { type: Sequelize.STRING(255), allowNull: true },
        grade: { type: Sequelize.STRING(255), allowNull: true },
        operator_name: { type: Sequelize.STRING(255), allowNull: true },
        date_time: { type: Sequelize.DATE, allowNull: true },
        machine: { type: Sequelize.STRING(255), allowNull: true },
        product_name: { type: Sequelize.STRING(255), allowNull: true },
        barcode: { type: Sequelize.STRING(255), allowNull: true },
        status: { type: Sequelize.STRING(50), allowNull: true },
        print_time: { type: Sequelize.DATE, allowNull: true },
        result_status: { type: Sequelize.STRING(50), allowNull: true },
        user_id: { type: Sequelize.STRING(50), allowNull: true },
      });
    }

    // Indexes — guard each so a re-run never fails.
    const addIndexIfMissing = async (name, fields) => {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT 1 FROM sys.indexes WHERE name = :name`,
        { replacements: { name } }
      );
      if (!rows || rows.length === 0) {
        await queryInterface.addIndex("production_logs", {
          name,
          fields,
        });
      }
    };

    // Listing + summary: WHERE user_id ORDER BY date_time DESC
    await addIndexIfMissing("IX_production_logs_user_datetime", [
      "user_id",
      { name: "date_time", order: "DESC" },
    ]);

    // Status-filtered listing
    await addIndexIfMissing("IX_production_logs_user_status", [
      "user_id",
      "status",
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("production_logs");
  },
};
