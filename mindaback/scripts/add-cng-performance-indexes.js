// Supplementary performance indexes for the CNG tables (the migration already
// creates the core ones; this mirrors add-plc-performance-indexes.js and is safe
// to re-run). SQL Server: each index is created only if it does not already exist.

import { sequelize } from "../src/sequelize.js";

const indexes = [
  // cng_stage_record is the hot table: the trace filters by pipe_id and orders by
  // stage_no; history/machine views filter by machine_id.
  { table: "cng_stage_record", name: "idx_cng_rec_pipe_stage", cols: "pipe_id, stage_no, recorded_at" },
  { table: "cng_stage_record", name: "idx_cng_rec_machine", cols: "machine_id, recorded_at" },
  { table: "cng_stage_record", name: "idx_cng_rec_status", cols: "status" },
  // cng_cylinder: the dashboard counts by status and occupancy groups by stage.
  { table: "cng_cylinder", name: "idx_cng_cyl_status_stage", cols: "status, current_stage_no" },
  { table: "cng_cylinder", name: "idx_cng_cyl_updated", cols: "updated_at" },
  { table: "cng_machine", name: "idx_cng_machine_lastseen", cols: "last_seen_at" },
  { table: "cng_production_run", name: "idx_cng_run_pipe_active", cols: "pipe_id, active" },
  // cng_defect: the trace loads defects by pipe_id; the dashboard counts open ones.
  { table: "cng_defect", name: "idx_cng_defect_pipe", cols: "pipe_id" },
  { table: "cng_defect", name: "idx_cng_defect_resolved", cols: "resolved" },
];

async function run() {
  await sequelize.authenticate();
  for (const ix of indexes) {
    const sql = `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = '${ix.name}' AND object_id = OBJECT_ID('${ix.table}'))
                 CREATE INDEX ${ix.name} ON ${ix.table} (${ix.cols});`;
    try {
      await sequelize.query(sql);
      console.log(`✓ ${ix.name} on ${ix.table}`);
    } catch (e) {
      console.error(`✗ ${ix.name}:`, e.message);
    }
  }
  await sequelize.close();
  console.log("CNG indexes done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
