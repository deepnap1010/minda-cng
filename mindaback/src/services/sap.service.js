// SAP ingest service — accept-everything raw store. Stores whatever SAP pushes
// verbatim, extracting a couple of tolerant hints (doc type, reference) so the
// inbox is browsable. Never rejects valid JSON.

import crypto from "crypto";
import { Op } from "sequelize";
import { SapInboxModel, SapIngestKeyModel } from "../models/sap.model.js";
import { upsertMachineLive } from "./cng.service.js";

const now = () => new Date();
export const hashKey = (plain) => crypto.createHash("sha256").update(String(plain)).digest("hex");

// Registered x-api-keys (no expiry). If none configured yet → open (discovery).
export async function verifyIngestKey(req) {
  const provided = req.headers["x-api-key"];
  const activeCount = await SapIngestKeyModel.count({ where: { active: true } });
  if (activeCount === 0) return { ok: true, open: true };
  if (!provided) return { ok: false };
  const match = await SapIngestKeyModel.findOne({ where: { key_hash: hashKey(provided), active: true } });
  if (!match) return { ok: false };
  match.last_used_at = now();
  await match.save();
  return { ok: true };
}

// First-match-wins lookup over a free-form object.
function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  const lower = {};
  for (const k of Object.keys(obj)) lower[k.toLowerCase()] = k;
  for (const a of keys) {
    const real = lower[a.toLowerCase()];
    if (real !== undefined && obj[real] != null && obj[real] !== "") return obj[real];
  }
  return undefined;
}

function safeHeaders(req) {
  const h = { ...req.headers };
  delete h["x-api-key"];
  delete h["authorization"];
  delete h["cookie"];
  return h;
}

const DOC_KEYS = ["docType", "doc_type", "type", "DOCTYPE", "idoctyp", "messageType", "msgtype", "sapDocType"];
const REF_KEYS = ["id", "ref", "reference", "docNum", "docNo", "documentNumber", "objectId", "objectKey", "sapId", "belnr"];
const MACHINE_KEYS = ["machineId", "machine_id", "machineCode", "machine_code", "deviceId", "device_id"];
const PIPE_KEYS = ["pipeId", "pipe_id", "cylinderId", "cylinder_id", "barcode", "serial", "srNo"];
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

// Map one incoming machine item (our spec shape OR a machine-status shape with
// meta.gauges) into the canonical form upsertMachineLive expects.
function mapSapItem(item) {
  if (!item || typeof item !== "object") return null;
  const machineId = pick(item, MACHINE_KEYS);
  if (machineId == null) return null;
  const meta = item.meta || {};
  const rawGauges = meta.gauges || item.gauges || [];
  const gauges = (Array.isArray(rawGauges) ? rawGauges : []).map((g) =>
    Array.isArray(g)
      ? { tag: slug(g[0]), label: g[0], value: g[1], min: g[2], max: g[3], unit: g[4] }
      : { tag: slug(g.label || g.tag), label: g.label || g.tag, value: g.value, min: g.min, max: g.max, unit: g.unit }
  );
  const data = {};
  gauges.forEach((g) => { if (g.value != null) data[g.tag] = g.value; });
  if (item.data && typeof item.data === "object") Object.assign(data, item.data);
  const primary = {
    label: meta.primL || item.primL || (gauges[0] && gauges[0].label) || null,
    value: meta.primV != null ? meta.primV : (item.primV != null ? item.primV : (gauges[0] ? gauges[0].value : null)),
    unit: meta.primU || item.primU || (gauges[0] && gauges[0].unit) || null,
  };
  return {
    machineId: String(machineId),
    name: item.name || item.machineName || null,
    stageNo: item.stageNo != null ? item.stageNo : (item.stage_no != null ? item.stage_no : null),
    status: item.status || (item.data && item.data.status) || null,
    line: item.line || null,
    gauges,
    primary,
    pipeId: pick(item, PIPE_KEYS),
    data,
  };
}

export async function ingestSap(body, req) {
  const docTypeRaw = pick(body, DOC_KEYS);
  const refRaw = pick(body, REF_KEYS);
  const flags = [];
  if (body == null || typeof body !== "object") flags.push("non_object_body");

  const doc = await SapInboxModel.create({
    doc_type: docTypeRaw != null ? String(docTypeRaw).slice(0, 120) : null,
    source_ref: refRaw != null ? String(refRaw).slice(0, 255) : null,
    raw_payload: body,
    headers: safeHeaders(req),
    content_type: req.headers["content-type"] || null,
    source_ip: String(req.headers["x-forwarded-for"] || req.ip || "").slice(0, 60),
    flags,
    received_at: now(),
  });

  // DIVIDE: split the payload into the cng_* tables. Accepts a single machine
  // object OR an array (batch) of machines. Each machine's live readings/gauges go
  // onto cng_machine (Machines page); if a Pipe ID is present, per-cylinder
  // telemetry is also recorded. The raw copy always stays in sap_inbox.
  const items = Array.isArray(body) ? body : [body];
  let divided = 0;
  const errors = [];
  for (const it of items) {
    const mapped = mapSapItem(it);
    if (!mapped) continue;
    try { await upsertMachineLive(mapped); divided++; }
    catch (e) { errors.push(mapped.machineId + ":" + (e.message || "err")); }
  }
  if (divided > 0) { doc.processed = true; await doc.save(); }
  else if (errors.length) { doc.flags = [...flags, "divide_failed"]; await doc.save(); }

  return { id: doc._id, docType: doc.doc_type, sourceRef: doc.source_ref, stored: true, machines: divided, errors: errors.slice(0, 5) };
}

export async function listInbox({ page = 1, limit = 25, docType, q, from, to } = {}) {
  const where = {};
  if (docType) where.doc_type = docType;
  if (q) where.source_ref = { [Op.like]: `%${q}%` };
  if (from || to) {
    where.received_at = {};
    if (from) where.received_at[Op.gte] = new Date(from);
    if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); where.received_at[Op.lte] = t; }
  }
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const { rows, count } = await SapInboxModel.findAndCountAll({
    where, order: [["received_at", "DESC"]], limit: Number(limit), offset, raw: true,
  });
  return {
    page: Number(page), limit: Number(limit), total: count,
    data: rows.map((r) => ({
      id: r._id, docType: r.doc_type, sourceRef: r.source_ref,
      contentType: r.content_type, sourceIp: r.source_ip, processed: r.processed, receivedAt: r.received_at,
    })),
  };
}

export async function getInboxItem(id) {
  const r = await SapInboxModel.findOne({ where: { _id: id }, raw: true });
  if (!r) return null;
  return {
    id: r._id, docType: r.doc_type, sourceRef: r.source_ref, contentType: r.content_type,
    sourceIp: r.source_ip, headers: r.headers, payload: r.raw_payload, flags: r.flags,
    processed: r.processed, receivedAt: r.received_at,
  };
}

export async function createIngestKey(label) {
  const plain = `sap_${crypto.randomBytes(24).toString("hex")}`;
  await SapIngestKeyModel.create({ key_hash: hashKey(plain), label: label || null, active: true });
  return { key: plain, label: label || null }; // plaintext returned ONCE
}

export async function listIngestKeys() {
  const rows = await SapIngestKeyModel.findAll({ order: [["created_at", "DESC"]], raw: true });
  return rows.map((k) => ({ id: k._id, label: k.label, active: k.active, lastUsedAt: k.last_used_at, createdAt: k.created_at }));
}
