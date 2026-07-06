"use strict";

// Creates the CNG cylinder-process tables in JPMDO. Idempotent (safe to re-run):
// each table is created only if missing. New + additive — no foreign keys into
// MINDA tables, nothing existing is altered. JSON columns are NVARCHAR(MAX)
// (Sequelize.TEXT on SQL Server) and the models read/write them via DataTypes.JSON.

const tableExists = async (qi, name) =>
  qi.describeTable(name).then(() => true).catch(() => false);

const addIndexSafe = async (qi, table, fields, name) => {
  try {
    await qi.addIndex(table, { fields, name });
  } catch (e) {
    // index already exists or table mid-create — ignore
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const pk = {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
      allowNull: false,
    };
    const ts = {
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("GETDATE()") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("GETDATE()") },
    };
    const JSONCOL = Sequelize.TEXT; // NVARCHAR(MAX) on SQL Server

    if (!(await tableExists(queryInterface, "cng_cylinder"))) {
      await queryInterface.createTable("cng_cylinder", {
        _id: pk,
        pipe_id: { type: Sequelize.STRING(120), allowNull: false, unique: true },
        status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "in_process" },
        current_stage_no: { type: Sequelize.INTEGER, allowNull: true },
        current_machine_id: { type: Sequelize.STRING(120), allowNull: true },
        latest_data: { type: JSONCOL, allowNull: true },
        started_at: { type: Sequelize.DATE, allowNull: true },
        completed_at: { type: Sequelize.DATE, allowNull: true },
        ...ts,
      });
      await addIndexSafe(queryInterface, "cng_cylinder", ["status"], "idx_cng_cyl_status");
      await addIndexSafe(queryInterface, "cng_cylinder", ["current_stage_no"], "idx_cng_cyl_stage");
    }

    if (!(await tableExists(queryInterface, "cng_machine"))) {
      await queryInterface.createTable("cng_machine", {
        _id: pk,
        machine_id: { type: Sequelize.STRING(120), allowNull: false, unique: true },
        name: { type: Sequelize.STRING(160), allowNull: true },
        machine_type: { type: Sequelize.STRING(120), allowNull: true },
        dialect: { type: Sequelize.STRING(20), allowNull: true },
        stage_no: { type: Sequelize.INTEGER, allowNull: true },
        status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "unknown" },
        active_pipe_id: { type: Sequelize.STRING(120), allowNull: true },
        metrics_seen: { type: JSONCOL, allowNull: true },
        thresholds: { type: JSONCOL, allowNull: true },
        last_seen_at: { type: Sequelize.DATE, allowNull: true },
        ...ts,
      });
      await addIndexSafe(queryInterface, "cng_machine", ["stage_no"], "idx_cng_machine_stage");
      await addIndexSafe(queryInterface, "cng_machine", ["status"], "idx_cng_machine_status");
    }

    if (!(await tableExists(queryInterface, "cng_stage_record"))) {
      await queryInterface.createTable("cng_stage_record", {
        _id: pk,
        pipe_id: { type: Sequelize.STRING(120), allowNull: false },
        stage_no: { type: Sequelize.INTEGER, allowNull: false },
        stage_name: { type: Sequelize.STRING(120), allowNull: true },
        machine_id: { type: Sequelize.STRING(120), allowNull: true },
        status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "ok" },
        headline_label: { type: Sequelize.STRING(120), allowNull: true },
        headline_value: { type: Sequelize.FLOAT, allowNull: true },
        metrics: { type: JSONCOL, allowNull: true },
        deviations: { type: JSONCOL, allowNull: true },
        flags: { type: JSONCOL, allowNull: true },
        reading_id: { type: Sequelize.STRING(60), allowNull: true },
        source: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "ingest" },
        entered_by: { type: Sequelize.STRING(120), allowNull: true },
        recorded_at: { type: Sequelize.DATE, allowNull: true },
        ...ts,
      });
      await addIndexSafe(queryInterface, "cng_stage_record", ["pipe_id", "stage_no"], "idx_cng_rec_pipe_stage");
      await addIndexSafe(queryInterface, "cng_stage_record", ["machine_id", "recorded_at"], "idx_cng_rec_machine_time");
      await addIndexSafe(queryInterface, "cng_stage_record", ["recorded_at"], "idx_cng_rec_time");
    }

    if (!(await tableExists(queryInterface, "cng_production_run"))) {
      await queryInterface.createTable("cng_production_run", {
        _id: pk,
        pipe_id: { type: Sequelize.STRING(120), allowNull: false },
        machine_id: { type: Sequelize.STRING(120), allowNull: false },
        stage_no: { type: Sequelize.INTEGER, allowNull: true },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        started_at: { type: Sequelize.DATE, allowNull: true },
        ended_at: { type: Sequelize.DATE, allowNull: true },
        started_by: { type: Sequelize.STRING(120), allowNull: true },
        ...ts,
      });
      await addIndexSafe(queryInterface, "cng_production_run", ["machine_id", "active"], "idx_cng_run_machine_active");
      await addIndexSafe(queryInterface, "cng_production_run", ["pipe_id"], "idx_cng_run_pipe");
    }

    if (!(await tableExists(queryInterface, "cng_defect"))) {
      await queryInterface.createTable("cng_defect", {
        _id: pk,
        pipe_id: { type: Sequelize.STRING(120), allowNull: false },
        stage_no: { type: Sequelize.INTEGER, allowNull: true },
        machine_id: { type: Sequelize.STRING(120), allowNull: true },
        type: { type: Sequelize.STRING(40), allowNull: true },
        field: { type: Sequelize.STRING(120), allowNull: true },
        value: { type: Sequelize.FLOAT, allowNull: true },
        message: { type: Sequelize.STRING(400), allowNull: true },
        resolved: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        detected_at: { type: Sequelize.DATE, allowNull: true },
        ...ts,
      });
      await addIndexSafe(queryInterface, "cng_defect", ["pipe_id"], "idx_cng_defect_pipe");
      await addIndexSafe(queryInterface, "cng_defect", ["resolved"], "idx_cng_defect_resolved");
    }

    if (!(await tableExists(queryInterface, "cng_ingest_key"))) {
      await queryInterface.createTable("cng_ingest_key", {
        _id: pk,
        key_hash: { type: Sequelize.STRING(120), allowNull: false, unique: true },
        label: { type: Sequelize.STRING(120), allowNull: true },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        last_used_at: { type: Sequelize.DATE, allowNull: true },
        ...ts,
      });
      await addIndexSafe(queryInterface, "cng_ingest_key", ["active"], "idx_cng_key_active");
    }
  },

  async down(queryInterface) {
    // Drop in any order — no FKs between them.
    for (const t of [
      "cng_stage_record",
      "cng_production_run",
      "cng_defect",
      "cng_ingest_key",
      "cng_machine",
      "cng_cylinder",
    ]) {
      await queryInterface.dropTable(t).catch(() => {});
    }
  },
};
