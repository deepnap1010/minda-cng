// Outbound cylinder->SAP pull feed (read-only). Same consumer as the template
// sync feed: Minda's engineers poll with the shared SAP_SYNC_API_KEY and push
// what they get into SAP HANA.
//
// Unlike the template feed this is NOT an outbox — cylinder telemetry is high
// volume and rewrites the same cylinder row on every stage, so we serve
// cursor-based delta pulls straight off the cng_* tables instead (zero new
// tables, nothing to purge):
//   - /sync/cylinders      → STATE stream: cylinders whose state changed since
//                            the cursor (keyset on updated_at + _id)
//   - /sync/stage-records  → EVENT stream: append-only per-stage events
//                            (keyset on created_at + _id)
// The cursor is opaque to clients: "<ISO timestamp>|<row _id>". Clients persist
// nextCursor and echo it back; hasMore=true means poll again immediately.

import { Op } from "sequelize";
import {
  CngCylinderModel,
  CngStageRecordModel,
} from "../models/cng.model.js";
import { asObj, getCylinderTrace } from "./cng.service.js";
import { stageName } from "../cng/stages.js";

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 100;

export function clampLimit(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Parse `cursor` ("<ISO>|<id>") or `since` (ISO timestamp) into {ts, id}.
// Returns null when the input is present but unparseable (caller → 400).
// The id half must be a GUID — anything else would hit a uniqueidentifier
// conversion error in SQL Server (500) instead of a clean 400.
export function parseCursor({ cursor, since }) {
  if (cursor) {
    if (typeof cursor !== "string") return null;
    const sep = cursor.indexOf("|");
    const iso = sep === -1 ? cursor : cursor.slice(0, sep);
    const id = sep === -1 ? null : cursor.slice(sep + 1) || null;
    const ts = new Date(iso);
    if (Number.isNaN(ts.getTime())) return null;
    if (id && !GUID_RE.test(id)) return null;
    return { ts, id };
  }
  if (since) {
    if (typeof since !== "string") return null;
    const ts = new Date(since);
    if (Number.isNaN(ts.getTime())) return null;
    return { ts, id: null };
  }
  return { ts: new Date(0), id: null }; // no cursor → full sync from the beginning
}

// Keyset condition: rows strictly after (ts, id) in (timeCol ASC, _id ASC)
// order, AND older than the stability window. The window keeps rows out of the
// feed until in-flight transactions have surely committed — timestamps are set
// in Node before the INSERT commits, so without it a poll racing a slow commit
// could advance the cursor past a row that becomes visible later (lost forever).
const STABILITY_MS = 3000;

function afterCursor(timeCol, { ts, id }) {
  const stableBefore = { [timeCol]: { [Op.lt]: new Date(Date.now() - STABILITY_MS) } };
  const after = !id
    ? { [timeCol]: { [Op.gt]: ts } }
    : {
        [Op.or]: [
          { [timeCol]: { [Op.gt]: ts } },
          { [timeCol]: ts, _id: { [Op.gt]: id } },
        ],
      };
  return { [Op.and]: [after, stableBefore] };
}

const cursorOf = (timeCol, rows) => {
  if (!rows.length) return null;
  const last = rows[rows.length - 1];
  const t = last[timeCol] instanceof Date ? last[timeCol].toISOString() : new Date(last[timeCol]).toISOString();
  return `${t}|${last._id}`;
};

// On an empty page the cursor must NOT regress: echo the caller's position back
// so "always persist nextCursor" is safe for clients even on quiet polls.
const echoCursor = ({ cursor, since }, pos) => {
  if (cursor) return cursor;
  if (since) return `${pos.ts.toISOString()}|`;
  return null; // true first sync with an empty table — client just retries cursorless
};

// STATE stream — cylinders changed since the cursor (each row = current snapshot).
export async function pullCylinders({ cursor, since, status, limit } = {}) {
  const pos = parseCursor({ cursor, since });
  if (!pos) return { badCursor: true };
  const lim = clampLimit(limit);

  const where = { ...afterCursor("updated_at", pos) };
  if (status) where.status = String(status);

  const rows = await CngCylinderModel.findAll({
    where,
    order: [["updated_at", "ASC"], ["_id", "ASC"]],
    limit: lim,
    raw: true,
  });

  return {
    data: rows.map((c) => ({
      pipeId: c.pipe_id,
      status: c.status,
      currentStageNo: c.current_stage_no,
      currentStageName: c.current_stage_no ? stageName(c.current_stage_no) : null,
      currentMachineId: c.current_machine_id,
      latestData: asObj(c.latest_data),
      startedAt: c.started_at,
      completedAt: c.completed_at,
      updatedAt: c.updated_at,
    })),
    hasMore: rows.length === lim,
    nextCursor: rows.length ? cursorOf("updated_at", rows) : echoCursor({ cursor, since }, pos),
  };
}

// EVENT stream — append-only per-stage records (never updated after insert).
// Dedupe key for consumers: recordId.
export async function pullStageRecords({ cursor, since, stageNo, pipeId, limit } = {}) {
  const pos = parseCursor({ cursor, since });
  if (!pos) return { badCursor: true };
  const lim = clampLimit(limit);

  const where = { ...afterCursor("created_at", pos) };
  if (stageNo !== undefined && stageNo !== null && stageNo !== "") {
    const sn = Number(stageNo);
    if (!Number.isInteger(sn) || sn < 1) return { badParam: "stage_no must be an integer (1-21)" };
    where.stage_no = sn; // NaN would reach the SQL literal and 500 on MSSQL
  }
  if (pipeId) where.pipe_id = String(pipeId);

  const rows = await CngStageRecordModel.findAll({
    where,
    order: [["created_at", "ASC"], ["_id", "ASC"]],
    limit: lim,
    raw: true,
  });

  return {
    data: rows.map((r) => ({
      recordId: r._id,
      pipeId: r.pipe_id,
      stageNo: r.stage_no,
      stageName: r.stage_name,
      machineId: r.machine_id,
      status: r.status,
      headline: { label: r.headline_label, value: r.headline_value },
      metrics: asObj(r.metrics),
      deviations: asObj(r.deviations),
      source: r.source,
      enteredBy: r.entered_by,
      recordedAt: r.recorded_at,
      createdAt: r.created_at,
    })),
    hasMore: rows.length === lim,
    nextCursor: rows.length ? cursorOf("created_at", rows) : echoCursor({ cursor, since }, pos),
  };
}

// On-demand deep pull: full 21-stage trace for one cylinder.
export async function pullCylinderTrace(pipeId) {
  return getCylinderTrace(pipeId);
}
