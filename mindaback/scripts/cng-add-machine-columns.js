// Adds the machine-status columns to cng_machine (additive, idempotent).
// Needed after upgrading the CngMachine model to support machine-status feeds.
import { sequelize } from "../src/sequelize.js";

const stmts = [
  "IF COL_LENGTH('cng_machine','line') IS NULL ALTER TABLE [cng_machine] ADD [line] nvarchar(80) NULL",
  "IF COL_LENGTH('cng_machine','latest_data') IS NULL ALTER TABLE [cng_machine] ADD [latest_data] nvarchar(max) NULL",
  "IF COL_LENGTH('cng_machine','gauges') IS NULL ALTER TABLE [cng_machine] ADD [gauges] nvarchar(max) NULL",
  "IF COL_LENGTH('cng_machine','primary_label') IS NULL ALTER TABLE [cng_machine] ADD [primary_label] nvarchar(120) NULL",
  "IF COL_LENGTH('cng_machine','primary_value') IS NULL ALTER TABLE [cng_machine] ADD [primary_value] float NULL",
  "IF COL_LENGTH('cng_machine','primary_unit') IS NULL ALTER TABLE [cng_machine] ADD [primary_unit] nvarchar(40) NULL",
];

async function run() {
  await sequelize.authenticate();
  for (const s of stmts) { await sequelize.query(s); console.log("✓ " + s.match(/ADD \[(\w+)\]/)[1]); }
  await sequelize.close();
  console.log("cng_machine columns ready.");
  process.exit(0);
}
run().catch((e) => { console.error("failed:", e.message); process.exit(1); });
