// Tolerant normalizer: turns a raw EKC/JCI-style packet into a clean, dialect-
// agnostic shape. Pure functions — no DB, no side effects. The ingest path stores
// the raw packet verbatim first, THEN runs this to derive what the dashboard shows.

import {
  ID_KEYS, TS_KEYS, DATA_KEYS, PIPE_ID_KEYS, NAME_KEYS, TYPE_KEYS, STAGE_KEYS,
  FAULT_SENTINELS, FIELD_ALIASES, PARAM_PAIRS, HEADLINE_PRIORITY,
} from "./aliases.js";

// Case-insensitive first-match-wins lookup over an object using an alias list.
function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  const lower = {};
  for (const k of Object.keys(obj)) lower[k.toLowerCase()] = k;
  for (const alias of keys) {
    const real = lower[alias.toLowerCase()];
    if (real !== undefined && obj[real] !== undefined && obj[real] !== null && obj[real] !== "") {
      return obj[real];
    }
  }
  return undefined;
}

// Coerce numeric strings to numbers; leave everything else as-is.
export function num(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return v;
}

export function isFault(v) {
  return typeof v === "number" && FAULT_SENTINELS.has(v);
}

// Extract the measurement bag: a DATA_KEYS object if present, else the bare
// top-level keys minus envelope/meta keys.
function extractData(body) {
  for (const k of DATA_KEYS) {
    const real = Object.keys(body || {}).find((x) => x.toLowerCase() === k.toLowerCase());
    if (real && body[real] && typeof body[real] === "object" && !Array.isArray(body[real])) {
      return body[real];
    }
  }
  const skip = new Set([...ID_KEYS, ...TS_KEYS, ...NAME_KEYS, ...TYPE_KEYS, ...PIPE_ID_KEYS, ...DATA_KEYS].map((s) => s.toLowerCase()));
  const out = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (!skip.has(k.toLowerCase()) && typeof v !== "object") out[k] = v;
  }
  return out;
}

// Guess which dialect a packet is, for labelling only.
function guessDialect(body) {
  const keys = new Set(Object.keys(body || {}).map((k) => k.toLowerCase()));
  if (keys.has("machine_id") || keys.has("ts")) return "EKC";
  if (keys.has("machineid") || keys.has("timestamp")) return "JCI";
  return null;
}

function parseTs(v) {
  if (v === undefined || v === null) return null;
  // EKC sends microsecond/second epoch; JCI sends ISO-8601.
  if (typeof v === "number") {
    let ms = v;
    if (v > 1e15) ms = Math.round(v / 1000); // microseconds → ms
    else if (v < 1e12) ms = v * 1000; // seconds → ms
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Build the clean metric bag from the raw data using FIELD_ALIASES, then carry
// the remaining scalar fields through (so nothing useful is hidden), flagging
// fault sentinels.
export function cleanMetrics(data) {
  const clean = {};
  const flags = [];
  const used = new Set();

  for (const [metric, aliases] of Object.entries(FIELD_ALIASES)) {
    const lower = {};
    for (const k of Object.keys(data || {})) lower[k.toLowerCase()] = k;
    for (const a of aliases) {
      const real = lower[a.toLowerCase()];
      if (real !== undefined && data[real] !== undefined && data[real] !== null && data[real] !== "") {
        const val = num(data[real]);
        used.add(real.toLowerCase());
        if (isFault(val)) { clean[metric] = "FAULT"; flags.push(`fault:${metric}`); }
        else clean[metric] = val;
        break;
      }
    }
  }

  // Setpoint/actual deviations.
  const deviations = {};
  for (const [setKey, actKey] of PARAM_PAIRS) {
    const s = num(data?.[setKey]); const a = num(data?.[actKey]);
    if (typeof s === "number" && typeof a === "number") {
      deviations[setKey] = { set: s, actual: a, delta: Number((a - s).toFixed(4)) };
    }
  }

  // Carry remaining scalars (capped) so the card's "more fields" list isn't empty.
  const extra = {};
  let n = 0;
  for (const [k, v] of Object.entries(data || {})) {
    if (used.has(k.toLowerCase())) continue;
    if (typeof v === "object") continue;
    const val = num(v);
    if (isFault(val)) { extra[k] = "FAULT"; flags.push(`fault:${k}`); }
    else extra[k] = val;
    if (++n >= 40) break;
  }

  return { clean, deviations, extra, flags };
}

// Choose a single headline metric for the card.
export function pickHeadline(clean) {
  for (const m of HEADLINE_PRIORITY) {
    if (clean[m] !== undefined && clean[m] !== "FAULT") {
      return { label: m, value: clean[m] };
    }
  }
  return { label: null, value: null };
}

// Derive a coarse machine status from the data, mirroring EKC/JCI derive logic.
export function deriveStatus(data, flags) {
  if (flags?.some((f) => f.startsWith("fault:"))) return "fault";
  const s = data?.status ?? data?.Status ?? data?.machineStatus;
  if (typeof s === "string") {
    const t = s.toLowerCase();
    if (["running", "run", "on", "active"].includes(t)) return "running";
    if (["idle", "wait", "ready"].includes(t)) return "idle";
    if (["stopped", "stop", "off", "down"].includes(t)) return "stopped";
  }
  if (data?.machineRunning === true) return "running";
  const speed = num(data?.speed ?? data?.rpm);
  if (typeof speed === "number") return speed > 0 ? "running" : "idle";
  return "running"; // a reading just arrived → treat as live by default
}

// The single entry point. Returns everything the ingest service needs.
export function normalizePacket(body) {
  const machineId = pick(body, ID_KEYS);
  const pipeIdInline = pick(body, PIPE_ID_KEYS);
  const name = pick(body, NAME_KEYS);
  const type = pick(body, TYPE_KEYS);
  const stageRaw = pick(body, STAGE_KEYS);
  const stageNo = stageRaw != null && !Number.isNaN(Number(stageRaw)) ? Number(stageRaw) : null;
  const deviceTs = parseTs(pick(body, TS_KEYS));
  const dialect = guessDialect(body);
  const data = extractData(body);
  const { clean, deviations, extra, flags } = cleanMetrics(data);
  const headline = pickHeadline(clean);
  const status = deriveStatus(data, flags);
  const fieldKeys = Object.keys(data || {});

  return {
    machineId: machineId != null ? String(machineId) : null,
    pipeIdInline: pipeIdInline != null ? String(pipeIdInline) : null,
    name: name != null ? String(name) : null,
    type: type != null ? String(type) : null,
    stageNo,
    dialect,
    deviceTs,
    data,
    fieldKeys,
    clean,
    deviations,
    extra,
    headline,
    status,
    flags,
  };
}
