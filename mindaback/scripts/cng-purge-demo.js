// Cutover helper: remove ALL demo/simulator CNG data so the dashboard shows only
// real machine data. Safe by construction — it only deletes telemetry tagged
// source='simulator' and the cylinders/defects/runs that belong exclusively to
// demo Pipe IDs. Real data (source='ingest'/'manual') is never touched.
//
// Usage:
//   node scripts/cng-purge-demo.js --dry-run   # preview counts, delete nothing
//   node scripts/cng-purge-demo.js             # perform the purge

import { Op } from "sequelize";
import { sequelize } from "../src/sequelize.js";
import {
  CngCylinderModel,
  CngMachineModel,
  CngStageRecordModel,
  CngProductionRunModel,
  CngDefectModel,
} from "../src/models/cng.model.js";
import { CngReadingModel } from "../src/models/cngReading.mongo.js";
import { ensureMongoConnected, isMongoReady } from "../src/config/mongodb.js";

const DRY = process.argv.includes("--dry-run");

async function distinctPipes(where) {
  const rows = await CngStageRecordModel.findAll({ where, attributes: ["pipe_id"], group: ["pipe_id"], raw: true });
  return rows.map((r) => r.pipe_id).filter(Boolean);
}

async function run() {
  await sequelize.authenticate();
  await ensureMongoConnected();

  // A Pipe ID is "demo" only if it has simulator records AND no real records.
  const simPipes = await distinctPipes({ source: "simulator" });
  const realPipes = new Set(await distinctPipes({ source: { [Op.ne]: "simulator" } }));
  const demoPipes = [...new Set(simPipes)].filter((p) => !realPipes.has(p));

  // Machines that have carried REAL data → keep. Everything else is demo-only → remove.
  const realMachineRows = await CngStageRecordModel.findAll({ where: { source: { [Op.ne]: "simulator" }, machine_id: { [Op.ne]: null } }, attributes: ["machine_id"], group: ["machine_id"], raw: true });
  const realMachineIds = realMachineRows.map((r) => r.machine_id);

  const simRecCount = await CngStageRecordModel.count({ where: { source: "simulator" } });
  const cylCount = demoPipes.length ? await CngCylinderModel.count({ where: { pipe_id: { [Op.in]: demoPipes } } }) : 0;
  const defCount = demoPipes.length ? await CngDefectModel.count({ where: { pipe_id: { [Op.in]: demoPipes } } }) : 0;
  const runCount = demoPipes.length ? await CngProductionRunModel.count({ where: { pipe_id: { [Op.in]: demoPipes } } }) : 0;
  const readingCount = isMongoReady() ? await CngReadingModel.countDocuments({ source: "simulator" }) : 0;
  const totalMachines = await CngMachineModel.count();
  const machineCount = realMachineIds.length === 0 ? totalMachines : await CngMachineModel.count({ where: { machine_id: { [Op.notIn]: realMachineIds } } });

  console.log(`Demo Pipe IDs: ${demoPipes.length}${demoPipes.length ? " (" + demoPipes.slice(0, 8).join(", ") + (demoPipes.length > 8 ? ", …" : "") + ")" : ""}`);
  console.log(`Would delete → stage_records:${simRecCount} cylinders:${cylCount} defects:${defCount} production_runs:${runCount} machines:${machineCount} mongo_readings:${readingCount}`);

  if (DRY) {
    console.log("\n--dry-run: nothing deleted.");
    await sequelize.close();
    process.exit(0);
  }

  await CngStageRecordModel.destroy({ where: { source: "simulator" } });
  if (isMongoReady()) await CngReadingModel.deleteMany({ source: "simulator" });
  if (demoPipes.length) {
    await CngCylinderModel.destroy({ where: { pipe_id: { [Op.in]: demoPipes } } });
    await CngDefectModel.destroy({ where: { pipe_id: { [Op.in]: demoPipes } } });
    await CngProductionRunModel.destroy({ where: { pipe_id: { [Op.in]: demoPipes } } });
  }
  // Remove demo-only machine cards (never carried real data); clear demo pointers off real machines.
  if (realMachineIds.length === 0) {
    await CngMachineModel.destroy({ where: {} });
  } else {
    await CngMachineModel.destroy({ where: { machine_id: { [Op.notIn]: realMachineIds } } });
    await CngMachineModel.update({ active_pipe_id: null }, { where: { active_pipe_id: { [Op.in]: demoPipes } } });
  }

  console.log("\n✓ Demo data purged. Dashboard now shows real data only.");
  await sequelize.close();
  process.exit(0);
}

run().catch((e) => {
  console.error("Purge failed:", e.message);
  process.exit(1);
});
