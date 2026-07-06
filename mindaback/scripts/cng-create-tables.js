// Safely create ONLY the cng_* tables in JPMDO (create-if-not-exists). Does NOT
// touch any Minda table and does NOT run the Sequelize migration runner — used
// when JPMDO already has the Minda schema but an empty SequelizeMeta.
//
// Usage:  node scripts/cng-create-tables.js

import { sequelize } from "../src/sequelize.js";
import { CngModels } from "../src/models/cng.model.js";

async function run() {
  await sequelize.authenticate();
  for (const [, model] of Object.entries(CngModels)) {
    await model.sync(); // CREATE TABLE IF NOT EXISTS (no alter, no drop)
    console.log("✓ ready:", model.tableName);
  }
  await sequelize.close();
  console.log("\nAll cng_* tables are present.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Create tables failed:", e.message);
  process.exit(1);
});
