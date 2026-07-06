// Creates the sap_* tables (create-if-not-exists, additive) and issues ONE
// ingest API key for SAP if none exists yet. Safe to re-run.
//
// Usage:  node scripts/sap-setup.js

import { sequelize } from "../src/sequelize.js";
import { SapModels, SapIngestKeyModel } from "../src/models/sap.model.js";
import { createIngestKey } from "../src/services/sap.service.js";

async function run() {
  await sequelize.authenticate();
  for (const [, m] of Object.entries(SapModels)) {
    await m.sync();
    console.log("✓ ready:", m.tableName);
  }

  const existing = await SapIngestKeyModel.count();
  if (existing === 0) {
    const { key } = await createIngestKey("Minda SAP push");
    console.log("\n========== SAP INGEST KEY — give this to the SAP team ==========");
    console.log("  x-api-key: " + key);
    console.log("===============================================================");
    console.log("  (shown only once — copy it now)\n");
  } else {
    console.log("\n" + existing + " SAP key(s) already exist. To issue a new one:");
    console.log("  POST /api/v1/sap/keys  (logged in)  →  returns a fresh key once.\n");
  }

  await sequelize.close();
  process.exit(0);
}

run().catch((e) => { console.error("SAP setup failed:", e.message); process.exit(1); });
