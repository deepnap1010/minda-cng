// Aligns a RESTORED local JPMDO to the current Minda models by adding columns
// that newer Minda code expects but an older DB restore is missing. Additive +
// idempotent (safe to re-run). Fixes Minda LOGIN (users) and the PLC dashboard
// worker (plc_data). Not needed on a DB created via the real migrations.
//
// Usage:  node scripts/cng-local-fix-schema.js

import { sequelize } from "../src/sequelize.js";

const fixes = [
  ["users.in_bin",          "IF COL_LENGTH('users','in_bin') IS NULL ALTER TABLE [users] ADD [in_bin] bit NOT NULL CONSTRAINT DF_users_in_bin DEFAULT 0"],
  ["users.binned_at",       "IF COL_LENGTH('users','binned_at') IS NULL ALTER TABLE [users] ADD [binned_at] datetime NULL"],
  ["users.binned_by",       "IF COL_LENGTH('users','binned_by') IS NULL ALTER TABLE [users] ADD [binned_by] nvarchar(255) NULL"],
  ["plc_data.part_no",      "IF COL_LENGTH('plc_data','part_no') IS NULL ALTER TABLE [plc_data] ADD [part_no] nvarchar(255) NULL"],
  ["plc_data.error_status", "IF COL_LENGTH('plc_data','error_status') IS NULL ALTER TABLE [plc_data] ADD [error_status] nvarchar(100) NULL"],
];

async function run() {
  await sequelize.authenticate();
  for (const [label, sql] of fixes) {
    await sequelize.query(sql);
    console.log("✓ " + label);
  }
  await sequelize.close();
  console.log("\nLocal schema aligned (additive). Restart the backend.");
  process.exit(0);
}
run().catch((e) => { console.error("fix failed:", e.message); process.exit(1); });
