// CNG service — all business logic for the cylinder process module.
// Raw telemetry → Mongo (accept everything); normalized state → SQL Server.
// Pure of Socket.io (the controller emits) to avoid circular imports.

import crypto from "crypto";
import { Op } from "sequelize";
import {
  CngCylinderModel,
  CngMachineModel,
  CngStageRecordModel,
  CngProductionRunModel,
  CngDefectModel,
  CngIngestKeyModel,
} from "../models/cng.model.js";
import { CngReadingModel } from "../models/cngReading.mongo.js";
import { isMongoReady } from "../config/mongodb.js";
import { normalizePacket } from "../cng/normalize.js";
import { CNG_STAGES, TOTAL_STAGES, stageName, stageByNo } from "../cng/stages.js";

const now = () => new Date();
export const hashKey = (plain) => crypto.createHash("sha256").update(String(plain)).digest("hex");

// MSSQL returns JSON columns as STRINGS. Parse before spreading/merging so we
// never spread a JSON string character-by-character (which explodes the key count
// and eventually breaks the JSON column with "unique keys exceeds limit 32768").
export const asObj = (v) => {
  if (v && typeof v === "object") return v;
  if (typeof v === "string") { try { const o = JSON.parse(v); return o && typeof o === "object" ? o : {}; } catch { return {}; } }
  return {};
};
const asArr = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") { try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; } }
  return [];
};

// ---------------------------------------------------------------------------
// Ingest auth: registered x-api-keys (no expiry). If NO active keys exist yet,
// run open (discovery) so the line can be brought up before keys are issued.
// ---------------------------------------------------------------------------
export async function verifyIngestKey(req) {
  const provided = req.headers["x-api-key"] || req.headers["X-API-KEY"];
  const activeCount = await CngIngestKeyModel.count({ where: { active: true } });
  if (activeCount === 0) return { ok: true, open: true };
  if (!provided) return { ok: false };
  const match = await CngIngestKeyModel.findOne({
    where: { key_hash: hashKey(provided), active: true },
  });
  if (!match) return { ok: false };
  match.last_used_at = now();
  await match.save();
  return { ok: true, keyId: match._id };
}

// Merge new field keys into a machine's metrics_seen registry.
function mergeSeen(existing, incoming) {
  const set = new Set(asArr(existing));
  for (const k of incoming || []) set.add(k);
  return Array.from(set).slice(0, 500);
}

async function upsertMachineFromPacket(n) {
  const machineId = n.machineId || "UNIDENTIFIED";
  let machine = await CngMachineModel.findOne({ where: { machine_id: machineId } });
  if (!machine) {
    machine = await CngMachineModel.create({
      machine_id: machineId,
      name: n.name || machineId,
      machine_type: n.type || null,
      dialect: n.dialect || null,
      stage_no: n.stageNo || null,
      status: n.status || "running",
      metrics_seen: n.fieldKeys || [],
      last_seen_at: now(),
    });
    return machine;
  }
  machine.last_seen_at = now();
  machine.status = n.status || machine.status;
  machine.metrics_seen = mergeSeen(machine.metrics_seen, n.fieldKeys);
  if (!machine.dialect && n.dialect) machine.dialect = n.dialect;
  if (!machine.name && n.name) machine.name = n.name;
  if (!machine.machine_type && n.type) machine.machine_type = n.type;
  if (!machine.stage_no && n.stageNo) machine.stage_no = n.stageNo; // machine declared its stage
  await machine.save();
  return machine;
}

async function recordDefects(pipeId, stageNo, machineId, n) {
  const faults = (n.flags || []).filter((f) => f.startsWith("fault:"));
  for (const f of faults) {
    const field = f.split(":")[1] || null;
    await CngDefectModel.create({
      pipe_id: pipeId,
      stage_no: stageNo,
      machine_id: machineId,
      type: "fault_sentinel",
      field,
      value: null,
      message: `Fault sentinel on ${field} at ${stageName(stageNo)}`,
      detected_at: now(),
    });
  }
}

// THE ingest path. Stores raw verbatim, normalizes, resolves Pipe ID via scan-in,
// writes the normalized stage record. Never rejects valid JSON for data reasons.
export async function ingestReading(body, { source = "ingest" } = {}) {
  const n = normalizePacket(body);
  const machine = await upsertMachineFromPacket(n);
  const machineId = machine.machine_id;
  const stageNo = machine.stage_no || null;

  // Pipe ID: scan-in active cylinder is primary; inline payload id is fallback.
  const pipeId = n.pipeIdInline || machine.active_pipe_id || null;
  const flags = [...(n.flags || [])];
  if (!n.machineId) flags.push("missing_machineId");
  if (!pipeId) flags.push("no_active_pipe");

  // 1) RAW verbatim → Mongo (audit/replay). Best-effort: telemetry store may be off.
  let readingId = null;
  if (isMongoReady()) {
    try {
      const doc = await CngReadingModel.create({
        machineId,
        pipeId,
        dialect: n.dialect,
        stageNo,
        source,
        rawPayload: body,
        data: n.data,
        clean: n.clean,
        flags,
        deviceTs: n.deviceTs,
        serverTs: now(),
      });
      readingId = String(doc._id);
    } catch (e) {
      flags.push("mongo_write_failed");
    }
  } else {
    flags.push("mongo_disabled");
  }

  // 2) NORMALIZED → SQL, only when we know which cylinder this belongs to.
  let advanced = false, fromStage = null, completed = false, rejected = false, nextOperatorId = null;
  if (pipeId) {
    const recStatus = flags.some((f) => f.startsWith("fault:")) ? "fault" : "ok";
    rejected = recStatus === "fault";
    let cylinder = await CngCylinderModel.findOne({ where: { pipe_id: pipeId } });
    if (!cylinder) {
      cylinder = await CngCylinderModel.create({
        pipe_id: pipeId,
        status: "in_process",
        started_at: now(),
      });
    }

    await CngStageRecordModel.create({
      pipe_id: pipeId,
      stage_no: stageNo || 0,
      stage_name: stageNo ? stageName(stageNo) : null,
      machine_id: machineId,
      status: recStatus,
      headline_label: n.headline.label,
      headline_value: typeof n.headline.value === "number" ? n.headline.value : null,
      metrics: { ...n.clean, ...n.extra },
      deviations: n.deviations,
      flags,
      reading_id: readingId,
      source,
      recorded_at: n.deviceTs || now(),
    });

    fromStage = cylinder.current_stage_no || null;
    cylinder.current_stage_no = stageNo || cylinder.current_stage_no;
    cylinder.current_machine_id = machineId;
    cylinder.latest_data = { ...asObj(cylinder.latest_data), ...n.clean };
    if (stageNo === TOTAL_STAGES) {
      cylinder.status = "completed";
      cylinder.completed_at = now();
      completed = true;
    }
    await cylinder.save();
    advanced = Boolean(stageNo) && stageNo !== fromStage;      // a real stage transition, not a repeat reading
    nextOperatorId = machine?.operator_user_id || null;         // operator of the stage the cylinder just arrived at

    await recordDefects(pipeId, stageNo, machineId, n);
  }

  return {
    machineId,
    pipeId,
    stageNo,
    stageName: stageNo ? stageName(stageNo) : null,
    readingId,
    status: n.status,
    dialect: n.dialect,
    hadPipe: Boolean(pipeId),
    flags,
    advanced,
    fromStage,
    toStage: stageNo || null,
    completed,
    rejected,
    nextOperatorId,
  };
}

// ---------------------------------------------------------------------------
// Scan-in: operator/barcode mounts a cylinder onto a machine (=> a stage).
// Incoming telemetry for that machine now attaches to this Pipe ID.
// ---------------------------------------------------------------------------
export async function scanIn({ machineId, pipeId, stageNo, userId }) {
  if (!machineId || !pipeId) throw new Error("machineId and pipeId are required");

  let machine = await CngMachineModel.findOne({ where: { machine_id: machineId } });
  if (!machine) {
    machine = await CngMachineModel.create({ machine_id: machineId, stage_no: stageNo || null });
  }
  const effStage = stageNo || machine.stage_no || null;

  let cylinder = await CngCylinderModel.findOne({ where: { pipe_id: pipeId } });
  if (!cylinder) {
    cylinder = await CngCylinderModel.create({ pipe_id: pipeId, status: "in_process", started_at: now() });
  }

  // Close any currently-active run on this machine.
  await CngProductionRunModel.update(
    { active: false, ended_at: now() },
    { where: { machine_id: machineId, active: true } }
  );

  const run = await CngProductionRunModel.create({
    pipe_id: pipeId,
    machine_id: machineId,
    stage_no: effStage,
    active: true,
    started_at: now(),
    started_by: userId || null,
  });

  machine.active_pipe_id = pipeId;
  if (!machine.stage_no && effStage) machine.stage_no = effStage;
  await machine.save();

  return { run, machine, cylinder };
}

// Pipe ID scheme: PC-<LINE>-<YYMMDD>-<NNNN>  e.g. PC-L1-260704-0007
const lineTag = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 6) || "L1";

async function generatePipeId(line) {
  const d = now();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const prefix = `PC-${lineTag(line)}-${ymd}-`;
  const seen = await CngCylinderModel.count({ where: { pipe_id: { [Op.like]: `${prefix}%` } } });
  for (let i = 0; i < 8; i++) {
    const candidate = `${prefix}${String(seen + 1 + i).padStart(4, "0")}`;
    const clash = await CngCylinderModel.findOne({ where: { pipe_id: candidate }, attributes: ["_id"] });
    if (!clash) return candidate;
  }
  return `${prefix}${Date.now().toString().slice(-5)}`; // safety fallback
}

// Stage 1 (Pipe Cutting) — manual operator entry. Births the cylinder + writes
// the Stage-1 config record. Pipe ID is minted server-side when not supplied.
export async function createCylinderManual({ pipeId, metrics, status, enteredBy, line, allowRevision }) {
  const clean = metrics && typeof metrics === "object" ? metrics : {};
  const generated = !pipeId;

  let cylinder = pipeId ? await CngCylinderModel.findOne({ where: { pipe_id: pipeId } }) : null;

  // Existing cylinder already cut at Stage 1 → return its recorded config
  // read-only (history preserved), do NOT duplicate, unless a revision is asked for.
  if (cylinder && !allowRevision) {
    const prior = await CngStageRecordModel.findOne({
      where: { pipe_id: pipeId, stage_no: 1 },
      order: [["recorded_at", "DESC"]],
    });
    if (prior) return { cylinder, record: prior, pipeId, generated: false, alreadyExists: true };
  }

  // Birth: create the cylinder, minting a unique id when none was supplied.
  if (!cylinder) {
    for (let attempt = 0; attempt < 6 && !cylinder; attempt++) {
      const id = pipeId || (await generatePipeId(line || clean.line));
      try {
        cylinder = await CngCylinderModel.create({
          pipe_id: id,
          status: "in_process",
          current_stage_no: 1,
          started_at: now(),
        });
        pipeId = id;
      } catch (e) {
        if (pipeId) throw e; // a caller-supplied id clash is a real error
        if (e?.name !== "SequelizeUniqueConstraintError") throw e; // else: minted id raced — retry
      }
    }
    if (!cylinder) throw new Error("could not mint a unique Pipe ID — please retry");
  }

  const record = await CngStageRecordModel.create({
    pipe_id: pipeId,
    stage_no: 1,
    stage_name: stageName(1),
    machine_id: null,
    status: status || "ok",
    metrics: clean,
    source: "manual",
    entered_by: enteredBy || null,
    recorded_at: now(),
  });
  cylinder.current_stage_no = cylinder.current_stage_no || 1;
  cylinder.latest_data = { ...asObj(cylinder.latest_data), ...clean };
  await cylinder.save();
  return { cylinder, record, pipeId, generated, alreadyExists: false };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
export function getStages() {
  return CNG_STAGES;
}

// Assign a standing operator to a machine (drives stage-handoff notifications).
export async function setMachineOperator(machineId, operatorUserId) {
  const machine = await CngMachineModel.findOne({ where: { machine_id: machineId } });
  if (!machine) throw new Error("machine not found");
  machine.operator_user_id = operatorUserId || null;
  await machine.save();
  return { machineId, operatorUserId: machine.operator_user_id };
}

export async function getDashboard() {
  const [total, inProcess, completed, scrapped, openDefects, machines] = await Promise.all([
    CngCylinderModel.count(),
    CngCylinderModel.count({ where: { status: "in_process" } }),
    CngCylinderModel.count({ where: { status: "completed" } }),
    CngCylinderModel.count({ where: { status: "scrapped" } }),
    CngDefectModel.count({ where: { resolved: false } }),
    CngMachineModel.findAll(),
  ]);

  const occupancyRows = await CngCylinderModel.findAll({
    attributes: ["current_stage_no", [CngCylinderModel.sequelize.fn("COUNT", CngCylinderModel.sequelize.col("_id")), "count"]],
    where: { status: "in_process", current_stage_no: { [Op.ne]: null } },
    group: ["current_stage_no"],
    raw: true,
  });
  const occupancy = CNG_STAGES.map((s) => ({
    stageNo: s.no,
    name: s.name,
    count: Number(occupancyRows.find((r) => Number(r.current_stage_no) === s.no)?.count || 0),
  }));

  const machineStatus = machines.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});

  const recent = await CngStageRecordModel.findAll({
    order: [["recorded_at", "DESC"]],
    limit: 20,
    raw: true,
  });

  return {
    kpis: { total, inProcess, completed, scrapped, openDefects, machines: machines.length },
    occupancy,
    machineStatus,
    activity: recent.map((r) => ({
      pipeId: r.pipe_id,
      stageNo: r.stage_no,
      stageName: r.stage_name,
      machineId: r.machine_id,
      status: r.status,
      headlineLabel: r.headline_label,
      headlineValue: r.headline_value,
      recordedAt: r.recorded_at,
    })),
  };
}

async function latestStageByMachine(machineId) {
  return CngStageRecordModel.findOne({
    where: { machine_id: machineId },
    order: [["recorded_at", "DESC"]],
    raw: true,
  });
}

// Machine-status upsert — for feeds that send each machine's current reading +
// gauges (with or without a cylinder). Stores the live values ON the machine so
// the Machines page shows them even when no cylinder is attached. If a Pipe ID is
// present, it ALSO records the per-cylinder telemetry via ingestReading.
const MSTATUS = { run: "running", running: "running", on: "running", active: "running", idle: "idle", ready: "idle", stop: "stopped", stopped: "stopped", off: "stopped", down: "stopped", maintenance: "maintenance", fault: "fault", error: "fault", alarm: "fault" };

export async function upsertMachineLive({ machineId, name, stageNo, status, line, gauges, primary, pipeId, data }) {
  if (!machineId) return { ok: false, reason: "no machineId" };
  const st = MSTATUS[String(status || "").toLowerCase()] || "running";
  const clean = data && typeof data === "object" ? data : {};
  let machine = await CngMachineModel.findOne({ where: { machine_id: machineId } });
  const pv = Number(primary?.value);
  const fields = {
    name: name || machine?.name || machineId,
    stage_no: stageNo != null ? Number(stageNo) : (machine?.stage_no ?? null),
    status: st,
    line: line || machine?.line || null,
    latest_data: clean,
    gauges: Array.isArray(gauges) ? gauges : [],
    primary_label: primary?.label || null,
    primary_value: Number.isFinite(pv) ? pv : null,
    primary_unit: primary?.unit || null,
    metrics_seen: mergeSeen(machine?.metrics_seen, Object.keys(clean)),
    last_seen_at: now(),
  };
  if (!machine) machine = await CngMachineModel.create({ machine_id: machineId, ...fields });
  else { Object.assign(machine, fields); await machine.save(); }

  let cyl = null;
  if (pipeId) cyl = await ingestReading({ machineId, pipeId, stageNo, data: clean }, { source: "sap" });
  return { ok: true, machineId, status: st, stageNo: fields.stage_no, hadPipe: Boolean(pipeId), cyl };
}

export async function listMachines() {
  const machines = await CngMachineModel.findAll({ order: [["stage_no", "ASC"]], raw: true });
  const out = [];
  for (const m of machines) {
    const latest = await latestStageByMachine(m.machine_id);
    out.push({
      machineId: m.machine_id,
      name: m.name,
      machineType: m.machine_type,
      dialect: m.dialect,
      stageNo: m.stage_no,
      stageName: m.stage_no ? stageName(m.stage_no) : null,
      status: m.status,
      activePipeId: m.active_pipe_id,
      operatorUserId: m.operator_user_id || null,
      lastSeenAt: m.last_seen_at,
      metricsSeen: asArr(m.metrics_seen),
      line: m.line || null,
      gauges: asArr(m.gauges),
      primary: m.primary_label != null ? { label: m.primary_label, value: m.primary_value, unit: m.primary_unit } : null,
      headline: latest ? { label: latest.headline_label, value: latest.headline_value } : (m.primary_label ? { label: m.primary_label, value: m.primary_value } : null),
      // raw:true returns MSSQL json columns as STRINGS — parse or the frontend
      // spreads them char-by-char into garbage gauges.
      metrics: asObj(latest?.metrics || m.latest_data),
    });
  }
  return out;
}

export async function getMachine(machineId, { historyLimit = 50, from, to } = {}) {
  const m = await CngMachineModel.findOne({ where: { machine_id: machineId }, raw: true });
  if (!m) return null;
  let readings = [];
  if (isMongoReady()) {
    readings = await CngReadingModel.find({ machineId })
      .sort({ serverTs: -1 })
      .limit(historyLimit)
      .lean();
  }
  const latest = await latestStageByMachine(machineId);

  // Recent cylinders processed at this machine — sourced from SQL (works without
  // Mongo) and optionally filtered by a recorded_at date range.
  const recWhere = { machine_id: machineId };
  if (from || to) {
    recWhere.recorded_at = {};
    if (from) recWhere.recorded_at[Op.gte] = new Date(from);
    if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); recWhere.recorded_at[Op.lte] = t; }
  }
  const recentRecs = await CngStageRecordModel.findAll({
    where: recWhere, order: [["recorded_at", "DESC"]], limit: 200, raw: true,
  });
  return {
    machineId: m.machine_id,
    name: m.name,
    machineType: m.machine_type,
    dialect: m.dialect,
    stageNo: m.stage_no,
    stageName: m.stage_no ? stageName(m.stage_no) : null,
    status: m.status,
    activePipeId: m.active_pipe_id,
    operatorUserId: m.operator_user_id || null,
    lastSeenAt: m.last_seen_at,
    // raw:true returns MSSQL json columns as STRINGS — parse them here or the
    // frontend spreads them char-by-char into garbage gauges.
    metricsSeen: asArr(m.metrics_seen),
    thresholds: asObj(m.thresholds),
    line: m.line || null,
    gauges: asArr(m.gauges),
    primary: m.primary_label != null ? { label: m.primary_label, value: m.primary_value, unit: m.primary_unit } : null,
    metrics: asObj(m.latest_data),
    latest: latest
      ? { metrics: asObj(latest.metrics), headline: { label: latest.headline_label, value: latest.headline_value }, status: latest.status, recordedAt: latest.recorded_at }
      : (m.latest_data ? { metrics: asObj(m.latest_data), headline: m.primary_label ? { label: m.primary_label, value: m.primary_value } : null, status: m.status, recordedAt: m.last_seen_at } : null),
    recent: recentRecs.map((r) => ({
      pipeId: r.pipe_id,
      stageNo: r.stage_no,
      stageName: r.stage_name,
      status: r.status,
      result: r.status === "fault" ? "fail" : "pass",
      headline: { label: r.headline_label, value: r.headline_value },
      ts: r.recorded_at,
    })),
    readings: readings.map((r) => ({
      pipeId: r.pipeId,
      clean: r.clean,
      data: r.data,
      flags: r.flags,
      serverTs: r.serverTs,
      deviceTs: r.deviceTs,
    })),
  };
}

export async function machineLatest(machineId) {
  if (!isMongoReady()) return null;
  return CngReadingModel.findOne({ machineId }).sort({ serverTs: -1 }).lean();
}

export async function machineHistory(machineId, limit = 200) {
  if (!isMongoReady()) return [];
  return CngReadingModel.find({ machineId }).sort({ serverTs: -1 }).limit(Math.min(limit, 500)).lean();
}

export async function listCylinders({ page = 1, limit = 25, status, stageNo, q } = {}) {
  const where = {};
  if (status) where.status = status;
  if (stageNo) where.current_stage_no = Number(stageNo);
  if (q) where.pipe_id = { [Op.like]: `%${q}%` };
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const { rows, count } = await CngCylinderModel.findAndCountAll({
    where,
    order: [["updated_at", "DESC"]],
    limit: Number(limit),
    offset,
    raw: true,
  });
  return {
    page: Number(page),
    limit: Number(limit),
    total: count,
    data: rows.map((c) => ({
      pipeId: c.pipe_id,
      status: c.status,
      currentStageNo: c.current_stage_no,
      currentStageName: c.current_stage_no ? stageName(c.current_stage_no) : null,
      currentMachineId: c.current_machine_id,
      startedAt: c.started_at,
      completedAt: c.completed_at,
      latestData: asObj(c.latest_data), // MSSQL json arrives as a string — return a real object to API consumers
    })),
  };
}

// Recent stage records, newest first — powers the "Cutting Stage Data" table on
// manual stages (what the operator entered with each Pipe ID), mirroring the
// factory's own JFE screen. Dashboard read; the /sync feed has its own cursor API.
export async function listStageRecords({ stageNo, machineId, pipeId, limit = 25 } = {}) {
  const where = {};
  if (stageNo !== undefined && stageNo !== null && stageNo !== "") {
    const sn = Number(stageNo);
    if (!Number.isInteger(sn) || sn < 1) return []; // bad filter → empty, never all-stage records
    where.stage_no = sn;
  }
  if (machineId) where.machine_id = String(machineId);
  if (pipeId) where.pipe_id = { [Op.like]: `%${String(pipeId)}%` };
  const lim = Math.min(Math.max(1, Number(limit) || 25), 200);
  const rows = await CngStageRecordModel.findAll({
    where,
    order: [["recorded_at", "DESC"]],
    limit: lim,
    raw: true,
  });
  return rows.map((r) => ({
    recordId: r._id,
    pipeId: r.pipe_id,
    stageNo: r.stage_no,
    stageName: r.stage_name,
    machineId: r.machine_id,
    status: r.status,
    metrics: asObj(r.metrics),
    source: r.source,
    enteredBy: r.entered_by,
    recordedAt: r.recorded_at,
  }));
}

// Full 21-stage trace for one Pipe ID.
export async function getCylinderTrace(pipeId) {
  const cylinder = await CngCylinderModel.findOne({ where: { pipe_id: pipeId }, raw: true });
  if (!cylinder) return null;
  // Bounded read: newest-first, first-seen-per-stage wins = latest record per
  // stage. A hot cylinder can accumulate thousands of records — never load all.
  const records = await CngStageRecordModel.findAll({
    where: { pipe_id: pipeId },
    order: [["recorded_at", "DESC"]],
    limit: 500,
    raw: true,
  });
  const byStage = new Map();
  for (const r of records) if (!byStage.has(r.stage_no)) byStage.set(r.stage_no, r);

  const timeline = CNG_STAGES.map((s) => {
    const r = byStage.get(s.no);
    let state = "pending";
    if (r) state = r.status === "fault" ? "fault" : "done";
    else if (cylinder.current_stage_no && s.no < cylinder.current_stage_no) state = "done";
    else if (cylinder.current_stage_no === s.no) state = "active";
    return {
      stageNo: s.no,
      name: s.name,
      gate: s.gate,
      manual: s.manual,
      state,
      machineId: r?.machine_id || null,
      status: r?.status || null,
      headline: r ? { label: r.headline_label, value: r.headline_value } : null,
      metrics: r ? asObj(r.metrics) : null, // parse MSSQL json strings → real objects for API consumers
      deviations: r ? asObj(r.deviations) : null,
      recordedAt: r?.recorded_at || null,
    };
  });

  const defects = await CngDefectModel.findAll({ where: { pipe_id: pipeId }, order: [["detected_at", "DESC"]], limit: 200, raw: true });

  return {
    pipeId: cylinder.pipe_id,
    status: cylinder.status,
    currentStageNo: cylinder.current_stage_no,
    startedAt: cylinder.started_at,
    completedAt: cylinder.completed_at,
    latestData: asObj(cylinder.latest_data),
    timeline,
    defects: defects.map((d) => ({ stageNo: d.stage_no, machineId: d.machine_id, type: d.type, field: d.field, message: d.message, resolved: d.resolved, detectedAt: d.detected_at })),
  };
}

export async function listDefects({ resolved } = {}) {
  const where = {};
  if (resolved === "true" || resolved === true) where.resolved = true;
  if (resolved === "false" || resolved === false) where.resolved = false;
  const rows = await CngDefectModel.findAll({ where, order: [["detected_at", "DESC"]], limit: 500, raw: true });
  return rows.map((d) => ({
    id: d._id,
    pipeId: d.pipe_id,
    stageNo: d.stage_no,
    stageName: d.stage_no ? stageName(d.stage_no) : null,
    machineId: d.machine_id,
    type: d.type,
    field: d.field,
    value: d.value,
    message: d.message,
    resolved: d.resolved,
    detectedAt: d.detected_at,
  }));
}

// ---------------------------------------------------------------------------
// Ingest key admin
// ---------------------------------------------------------------------------
export async function createIngestKey(label) {
  const plain = `cng_${crypto.randomBytes(24).toString("hex")}`;
  await CngIngestKeyModel.create({ key_hash: hashKey(plain), label: label || null, active: true });
  return { key: plain, label: label || null }; // plaintext returned ONCE
}

export async function listIngestKeys() {
  const rows = await CngIngestKeyModel.findAll({ order: [["created_at", "DESC"]], raw: true });
  return rows.map((k) => ({ id: k._id, label: k.label, active: k.active, lastUsedAt: k.last_used_at, createdAt: k.created_at }));
}

export { stageByNo };
