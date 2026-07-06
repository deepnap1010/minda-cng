// Walk a Pipe ID up the CNG line — simulates the PLC/SAP feed for stages 2..N.
// Calls the ingest service directly (no API key needed; local testing only).
//
//   node scripts/cng-advance.js <pipeId> [toStage=21] [--reject <stageNo>]
//
// Example:  node scripts/cng-advance.js PC-L1-260704-0003 6
//           node scripts/cng-advance.js PC-L1-260704-0003 21 --reject 13

import { ingestReading, getCylinderTrace } from "../src/services/cng.service.js";
import { CNG_STAGES } from "../src/cng/stages.js";
import { sequelize } from "../src/sequelize.js";

const rnd = (a, b) => Math.round((a + Math.random() * (b - a)) * 10) / 10;

// Realistic sample readings for notable stages; others get a generic pass reading.
const SAMPLE = {
  2: () => ({ spinningTemp: rnd(1040, 1075), diameter: rnd(231, 233) }),
  3: () => ({ bottomThk: rnd(6.0, 7.0) }),
  5: () => ({ neckTemp: rnd(900, 950), spindleRpm: Math.round(rnd(1400, 1600)) }),
  6: () => ({ furnaceTemp: rnd(870, 930), soak: Math.round(rnd(38, 46)) }),
  7: () => ({ hardness: rnd(85, 95) }),
  11: () => ({ wpTp: rnd(300, 340), proofPressure: rnd(280, 300) }),
  13: () => ({ leakRate: rnd(0, 0.08) }),
  17: () => ({ wallThk: rnd(5.6, 6.0) }),
  20: () => ({ bottomThk: rnd(6.0, 6.4) }),
};

const machineFor = (no, name) => name.replace(/[^A-Za-z]+/g, "").slice(0, 4).toUpperCase() + "-" + (200 + no);

async function main() {
  const pipeId = process.argv[2];
  const rest = process.argv.slice(3);
  const rejIdx = rest.indexOf("--reject");
  const rejectStage = rejIdx >= 0 ? Number(rest[rejIdx + 1]) : null;
  const toStage = Number(rest.find((a) => /^\d+$/.test(a)) || 21);

  if (!pipeId) {
    console.error("usage: node scripts/cng-advance.js <pipeId> [toStage=21] [--reject <stageNo>]");
    process.exit(1);
  }

  const trace = await getCylinderTrace(pipeId);
  if (!trace) {
    console.error(`No cylinder "${pipeId}" — create it in the Pipe Cutting screen first.`);
    process.exit(1);
  }

  const from = (trace.currentStageNo || 1) + 1;
  if (from > toStage) {
    console.log(`${pipeId} is already at stage ${trace.currentStageNo} — nothing to advance to (target ${toStage}).`);
    await sequelize.close();
    process.exit(0);
  }

  console.log(`Advancing ${pipeId}:  stage ${from} -> ${toStage}${rejectStage ? `  (reject at ${rejectStage})` : ""}\n`);
  for (let no = from; no <= toStage; no++) {
    const st = CNG_STAGES.find((s) => s.no === no);
    if (!st) continue;
    const machineId = machineFor(no, st.name);
    const fail = no === rejectStage;
    const data = {
      ...(SAMPLE[no] ? SAMPLE[no]() : { value: rnd(10, 100) }),
      result: fail ? "NG" : "OK",
      status: fail ? "fault" : "run",
    };
    await ingestReading({ machineId, machineName: st.name, stageNo: no, pipeId, timestamp: new Date().toISOString(), data }, { source: "simulator" });
    console.log(`  ${fail ? "✗" : "✓"} stage ${String(no).padStart(2, "0")}  ${st.name.padEnd(24)} @${machineId}  ${JSON.stringify(data)}`);
    if (fail) { console.log(`\n  Rejected at stage ${no} — stopping the line.`); break; }
  }

  console.log(`\nDone. Open Cylinder Trace and search:  ${pipeId}`);
  await sequelize.close();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
