// Mint a CNG telemetry ingest key — the x-api-key the PLC / edge gateway sends
// when it POSTs to /api/v1/cng/ingest.
//
// Run ON THE SERVER (uses that server's DB):
//     node scripts/cng-issue-key.js "Plant-1 CNG line PLC gateway"
//
// The plaintext key is printed ONCE — copy it immediately. Only its hash is
// stored, so it can never be recovered (mint a new one if lost).

import { createIngestKey, listIngestKeys } from "../src/services/cng.service.js";
import { sequelize } from "../src/sequelize.js";

async function run() {
  const label = process.argv.slice(2).join(" ").trim() || "cng ingest key";
  const { key } = await createIngestKey(label);
  console.log("\n  ✅ CNG ingest key created — COPY IT NOW (shown only once):\n");
  console.log("     x-api-key : " + key);
  console.log("     label     : " + label + "\n");
  const all = await listIngestKeys();
  console.log(`  (${all.filter((k) => k.active).length} active key(s) total)\n`);
  await sequelize.close();
  process.exit(0);
}

run().catch((e) => { console.error("failed:", e.message); process.exit(1); });
