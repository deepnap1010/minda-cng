// Create ALL additive tables for the merged build (cng_* + sap_*) on a server
// that ALREADY has the Minda schema. Uses model.sync() = CREATE TABLE IF NOT
// EXISTS: it creates only missing tables, never alters or drops an existing one,
// and never touches foreign keys. Safe to run on production, and idempotent
// (running it twice does nothing the second time).
//
// WHY THIS IS NEEDED: the app only auto-syncs tables when NODE_ENV=development
// (or DB_SYNC=true). Production runs NODE_ENV=production, so the new cylinder +
// SAP tables must be created once, explicitly, by this script.
//
// Run ONCE on the production server after deploying the merged code:
//     node scripts/create-new-tables.js

import { sequelize } from "../src/sequelize.js";
import { CngModels } from "../src/models/cng.model.js";                 // cng_* (cylinder module)
import { SapModels } from "../src/models/sap.model.js";                 // sap_inbox, sap_ingest_key (PLC/SAP ingest)
import { SapMaterialModel } from "../src/models/sapMaterial.model.js";  // sap_materials (material lookup)
import { SapSyncOutboxModel } from "../src/models/sapSyncOutbox.model.js"; // sap_sync_outbox (template->SAP feed)

async function run() {
  await sequelize.authenticate();
  console.log("Connected. Creating any missing additive tables (existing tables untouched)…\n");

  const groups = [
    ["cng",          CngModels],
    ["sap-ingest",   SapModels],
    ["sap-material", { SapMaterialModel }],
    ["sap-outbox",   { SapSyncOutboxModel }],
  ];

  let n = 0;
  for (const [label, models] of groups) {
    for (const [, model] of Object.entries(models)) {
      await model.sync(); // CREATE TABLE IF NOT EXISTS — no alter, no drop, no FK change
      console.log(`  ✓ [${label}] ${model.tableName}`);
      n++;
    }
  }

  await sequelize.close();
  console.log(`\nDone. ${n} table(s) ensured present. No existing Minda table was modified.`);
  process.exit(0);
}

run().catch((e) => { console.error("Create tables failed:", e.message); process.exit(1); });
