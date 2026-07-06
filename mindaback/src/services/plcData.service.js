import { PlcDataModel } from '../models/plcData.model.js'
import { PlcProductModel } from '../models/plcProduct.model.js'
import { MachineHistoryModel } from '../models/machineHistory.model.js'
import { NotFoundError } from '../utils/errorHandler.js'
import { Op, Sequelize } from 'sequelize'
import { sequelize } from '../sequelize.js'
import { getOrSetJSON, cacheDelByPrefix } from '../utils/redisCache.js'

// ── Safety bounds so a single request can never load the whole (600k+ row)
// plc_data table into Node memory. With no date filter we restrict to a recent
// window, and we hard-cap the rows pulled in for in-JS aggregation.
// Default window kept short so the first-load (no date filter) stays fast
// even when production has lakhs of rows. Users can apply a custom range
// to widen this from the report/stoppage pages.
const DEFAULT_QUERY_WINDOW_DAYS = 1
// Hard cap on rows pulled into Node for in-JS dedupe/aggregation.
// 100000 was making each report/stoppage load process a lakh rows in memory
// (1-3 min on production). The report page is paginated, so we only ever need
// a recent window; users wanting more must apply an explicit date filter.
const MAX_SCAN_ROWS = 6000

function defaultWindowStart() {
  const d = new Date()
  d.setDate(d.getDate() - DEFAULT_QUERY_WINDOW_DAYS)
  return d
}

// ── Redis caching for the heavy analytics endpoints ──────────────────────────
// The dashboard analytics (stoppage, time-distribution, downtime-by-*,
// error-distribution) each run GROUP BY / window aggregations over the full
// plc_data table (1.6M+ rows) on a 1GB SQL Express box, so the first hit is
// slow. These results only need to be "recent", not real-time, so we cache the
// JSON for a few minutes. Cache key is derived from the request filters, so a
// custom date range gets its own entry. If Redis is down, getOrSetJSON falls
// back to running the query live (no hard dependency).
const ANALYTICS_CACHE_PREFIX = 'plcAnalytics:'
const ANALYTICS_TTL_SECONDS = 600 // 5 min

// Build a stable cache key from one or more param objects (sorted keys so the
// order the frontend sends them in never matters).
function analyticsCacheKey(name, ...paramObjects) {
  const merged = {}
  for (const obj of paramObjects) {
    if (obj && typeof obj === 'object') {
      for (const k of Object.keys(obj)) merged[k] = obj[k]
    }
  }
  const parts = Object.keys(merged)
    .sort()
    .map((k) => `${k}=${merged[k] ?? ''}`)
    .join('&')
  return `${ANALYTICS_CACHE_PREFIX}${name}:${parts || 'all'}`
}

// Wrap an analytics fetcher with a Redis cache. Returns plain data (drops the
// {fromCache} wrapper) so callers/controllers are unchanged. ttlSeconds lets a
// "live-ish" endpoint use a shorter window than the heavy charts.
async function cachedAnalytics(name, paramObjects, fetchFn, ttlSeconds = ANALYTICS_TTL_SECONDS) {
  const key = analyticsCacheKey(name, ...paramObjects)
  const { data } = await getOrSetJSON(key, ttlSeconds, fetchFn)
  return data
}

// Optional: wipe all cached analytics (e.g. call after a bulk import).
export async function clearPlcAnalyticsCache() {
  await cacheDelByPrefix(ANALYTICS_CACHE_PREFIX)
}

/** Attach product name (from plc_products) to plc data by device_id = machine_name */
async function attachProductToPlcData(plcDataOrList) {
  const list = Array.isArray(plcDataOrList) ? plcDataOrList : [plcDataOrList]
  if (list.length === 0) return plcDataOrList

  // Revert to fetch all products to avoid missing any due to filter mismatches (trim/case)
  // Products table is typically small, so this is safer and doesn't hurt performance.
  const products = await PlcProductModel.findAll({})

  const productNameByMachine = {}
  products.forEach((p) => {
    const mName = p.machine_name?.trim()?.toLowerCase()
    if (mName) {
      const name =
        p.product_name ||
        p.material_description ||
        p.part_no ||
        p.model_code ||
        p.material_code ||
        p.machine_name
      productNameByMachine[mName] = name
    }
  })

  list.forEach((item) => {
    // FILL-IN ONLY: never override a product the row already carries from its
    // own payload (extra_data.product). The master is only used to fill rows
    // that have no product of their own. This keeps the report's per-row
    // accuracy intact even after plc_products is populated.
    const existing =
      typeof item.get === 'function' ? item.get('product') : item.product
    const hasOwnProduct =
      existing != null && !(typeof existing === 'string' && existing.trim() === '')
    if (hasOwnProduct) return

    const dId = item.device_id?.trim()?.toLowerCase()
    const product = dId ? productNameByMachine[dId] || null : null

    if (product) {
      if (typeof item.setDataValue === 'function') {
        item.setDataValue('product', product)
      } else {
        item.product = product
      }
    }
  })
  return plcDataOrList
}

// Known fields: incoming key -> DB column (for backward compatibility & filtering)
const KNOWN_MAP = {
  companyname: 'company_name',
  company_name: 'company_name',
  plantname: 'plant_name',
  plant_name: 'plant_name',
  linenumber: 'line_number',
  line_number: 'line_number',
  device_id: 'device_id',
  timestamp: 'timestamp',
  Start_time: 'start_time',
  start_time: 'start_time',
  Stop_time: 'stop_time',
  stop_time: 'stop_time',
  Status: 'status',
  status: 'status',
  model: 'model',
  MODEL: 'model',
  LATCH_FORCE: 'latch_force',
  latch_force: 'latch_force',
  CLAW_FORCE: 'claw_force',
  claw_force: 'claw_force',
  SAFETY_LEVER: 'safety_lever',
  safety_lever: 'safety_lever',
  CLAW_LEVER: 'claw_lever',
  claw_lever: 'claw_lever',
  STROKE: 'stroke',
  stroke: 'stroke',
  PRODUCTION_COUNT: 'production_count',
  'PRODUCTION-COUNT': 'production_count',
  production_count: 'production_count',
  ALARM: 'alarm',
  alarm: 'alarm',
}

const DATE_FIELDS = ['timestamp', 'start_time', 'stop_time']

/** Flatten nested payload (parameters, machine) into single object */
function flattenPayload(data) {
  if (!data || typeof data !== 'object') return {}
  const flat = { ...data }
  if (data.machine && typeof data.machine === 'object') {
    Object.assign(flat, data.machine)
  }
  if (data.parameters && typeof data.parameters === 'object') {
    Object.assign(flat, data.parameters)
  }
  return flat
}

/** Extract known columns + extra_data (dynamic fields) from flattened payload */
function extractKnownAndExtra(flat) {
  const known = {}
  const extra = {}
  for (const [key, value] of Object.entries(flat)) {
    if (key === 'machine' || key === 'parameters') continue
    const dbCol = KNOWN_MAP[key]
    if (dbCol) {
      let val = value
      if (DATE_FIELDS.includes(dbCol) && val) val = new Date(val)
      known[dbCol] = val ?? null
    } else {
      // Normalization for Error key (case-insensitive)
      if (key.toLowerCase() === 'error') {
        extra['Error'] = value
        continue
      }

      // Normalization for ERROR_STATUS key (case-insensitive)
      if (key.toLowerCase() === 'error_status') {
        extra['ERROR_STATUS'] = value
        continue
      }

      // Dynamic field - jo bhi aaya, store
      let val = value
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        try {
          val = new Date(value)
        } catch (_) {}
      }
      extra[key] = val
    }
  }
  return { known, extra }
}
export const createPlcDataService = async (data) => {
  const flat = flattenPayload(data)
  const { known, extra } = extractKnownAndExtra(flat)

  // The PLC payload nests the model inside `product` (extra_data.product.model),
  // so it never lands in the `model` column on its own. Copy it across so the
  // column is always populated — this is what the report dropdown and the
  // model filter rely on.
  if (
    (known.model == null || String(known.model).trim() === '') &&
    extra.product &&
    typeof extra.product === 'object' &&
    extra.product.model
  ) {
    known.model = extra.product.model
  }

  // Mirror two summary fields into their indexed columns (same reason as `model`
  // above): the report aggregates part_no and error_status over the FULL window,
  // so they must live in fast indexed columns, not only in JSON. NOTE: barcode_id
  // is a COMPUTED column on this table — SQL Server fills it from extra_data
  // automatically, so we must NOT write it here (doing so throws Msg 271).
  if (
    (known.part_no == null || String(known.part_no).trim() === '') &&
    extra.product &&
    typeof extra.product === 'object' &&
    extra.product.part_no != null
  ) {
    known.part_no = extra.product.part_no
  }
  if (known.error_status == null) {
    // ERROR_STATUS lives at the TOP LEVEL of the payload (confirmed in the data:
    // $.ERROR_STATUS is populated, $.parameters.ERROR_STATUS is not). Reading it
    // from `parameters` was the original bug that left Error Count stuck at 0.
    known.error_status =
      extra.ERROR_STATUS ??
      extra.error_status ??
      (extra.parameters && (extra.parameters.ERROR_STATUS ?? extra.parameters.error_status)) ??
      null
  }

  const { stop_time, device_id, production_count: payloadProd } = known

  // STOP logic
  if (stop_time && device_id && (payloadProd == null || payloadProd === '')) {
    const lastRunning = await PlcDataModel.findOne({
      where: { device_id, stop_time: null },
      order: [['start_time', 'DESC']],
      attributes: ['production_count'],
      raw: true,
    })

    if (lastRunning?.production_count != null) {
      known.production_count = lastRunning.production_count
    }
  }

  // Last record
  const lastRecord = await PlcDataModel.findOne({
    where: { device_id },
    order: [['created_at', 'DESC']],
  })

  // Build current record
  const currentRecord = PlcDataModel.build({
    ...known,
    extra_data: Object.keys(extra).length ? extra : {},
  }).toJSON()

  // Function to remove ignored fields
  const clean = (obj) => {
    const { _id, timestamp, created_at, updated_at, ...rest } = obj
    return rest
  }

  // Sort object keys for JSON.stringify
  const stringifySorted = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return `[${obj.map(stringifySorted).join(',')}]`
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `"${k}":${stringifySorted(obj[k])}`)
      .join(',')}}`
  }

  const cleanCurrent = clean(currentRecord)
  const cleanLast = lastRecord ? clean(lastRecord.toJSON()) : null

  console.log('=== KNOWN ===', JSON.stringify(known, null, 2))
  console.log('=== EXTRA ===', JSON.stringify(extra, null, 2))
  console.log('=== LAST RECORD ===', JSON.stringify(cleanLast, null, 2))

  // Compare using JSON.stringify
  if (lastRecord && stringifySorted(cleanCurrent) === stringifySorted(cleanLast)) {
    console.log('⚠️ No change detected → skipping insert')
    return {
      data: lastRecord.toJSON(),
      isNewRecord: false,
    }
  }

  // Insert new row
  const plcData = await PlcDataModel.create({
    ...known,
    extra_data: Object.keys(extra).length ? extra : {},
  })

  if (typeof attachProductToPlcData === 'function') {
    await attachProductToPlcData(plcData)
  }

  return {
    data: plcData.toJSON ? plcData.toJSON() : plcData.get({ plain: true }),
    isNewRecord: true,
  }
}
// export const createPlcDataService = async (data) => {
//   const flat = flattenPayload(data);
//   const { known, extra } = extractKnownAndExtra(flat);

//   const { stop_time, device_id, production_count: payloadProd } = known;

//   if (stop_time && device_id && (payloadProd == null || payloadProd === "")) {
//     const lastRunning = await PlcDataModel.findOne({
//       where: { device_id, stop_time: null },
//       order: [["start_time", "DESC"]],
//       attributes: ["production_count"],
//     });
//     if (lastRunning?.production_count != null) {
//       known.production_count = lastRunning.production_count;
//     }
//   }

//   const lastRecord = await PlcDataModel.findOne({
//     where: { device_id },
//     order: [["created_at", "DESC"]],
//     raw: true,
//   });

//   // ⬇️ SIRF YE LINES ADD KARO AUR OUTPUT DIKHAO MUJHE
//   console.log("=== KNOWN ===", JSON.stringify(known, null, 2));
//   console.log("=== EXTRA ===", JSON.stringify(extra, null, 2));
//   console.log("=== LAST RECORD ===", JSON.stringify(lastRecord, null, 2));

//   const plcData = await PlcDataModel.create({
//     ...known,
//     extra_data: Object.keys(extra).length ? extra : null,
//   });

//   await attachProductToPlcData(plcData);
//   return plcData.toJSON ? plcData.toJSON() : plcData.get({ plain: true });
// };
// export const createPlcDataService = async (data) => {
//   const flat = flattenPayload(data)
//   const { known, extra } = extractKnownAndExtra(flat)

//   // Jab stop_time aaye: next row (stopped row) mein production_count pata hona chahiye – last running se le aao agar payload mein nahi hai
//   const { stop_time, device_id, production_count: payloadProd } = known;
//   if (stop_time && device_id && (payloadProd == null || payloadProd === "")) {
//     const lastRunning = await PlcDataModel.findOne({
//       where: { device_id, stop_time: null },
//       order: [["start_time", "DESC"]],
//       attributes: ["production_count"],
//     });
//     if (lastRunning && lastRunning.production_count != null) {
//       known.production_count = lastRunning.production_count;
//     }
//   }

//   // Har payload (running ya stopped) – sirf nayi row create karo, kisi purani row ko update mat karo
//   const plcData = await PlcDataModel.create({
//     ...known,
//     extra_data: Object.keys(extra).length ? extra : null,
//   })

//   await attachProductToPlcData(plcData);
//   return plcData.toJSON ? plcData.toJSON() : plcData.get({ plain: true });
// };

export const getAllPlcDataService = async (filters = {}, pagination = {}) => {
  const where = {}

  if (filters.device_id) {
    where.device_id = { [Op.like]: `%${filters.device_id}%` }
  }

  if (filters.model) {
    where.model = { [Op.like]: `%${filters.model}%` }
  }

  if (filters.status) {
    where.status = { [Op.like]: `%${filters.status}%` }
  }

  if (filters.company_name) {
    where.company_name = { [Op.like]: `%${filters.company_name}%` }
  }

  if (filters.plant_name) {
    where.plant_name = { [Op.like]: `%${filters.plant_name}%` }
  }

  if (filters.startDate && filters.endDate) {
    where.created_at = {
      [Op.between]: [filters.startDate, filters.endDate],
    }
  }

  if (filters.timestampStart && filters.timestampEnd) {
    where.timestamp = {
      [Op.between]: [filters.timestampStart, filters.timestampEnd],
    }
  }

  // Safety net: with no date filter at all, never scan the whole table —
  // restrict to the recent window so the timestamp index is used.
  if (!where.timestamp && !where.created_at) {
    where.timestamp = { [Op.gte]: defaultWindowStart() }
  }

  // const page = Math.max(pagination.page || 1, 1)
  // const limit = Math.min(pagination.limit || 10, 5000)
  // const offset = (page - 1) * limit

  const plcDataList = await PlcDataModel.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: 5000, // safety cap: most-recent rows only, never the whole table
  })

  await attachProductToPlcData(plcDataList)
  return plcDataList
}
// ─────────────────────────────────────────────────────────────────────────────
// Helper: Map raw DB row + extra_data → what toJSON() would return
// ─────────────────────────────────────────────────────────────────────────────
function mapRawToPlain(row) {
  let extra = row.extra_data || {}
  if (typeof extra === 'string') {
    try {
      extra = JSON.parse(extra)
    } catch (_) {
      extra = {}
    }
  }

  const parameters = {}
  for (const [key, value] of Object.entries(extra)) {
    if (key === 'product' || key === 'PRODUCTION_COUNT' || key === 'Barcode_details') continue
    if (value !== null && typeof value !== 'object') {
      parameters[key] = value
    }
  }

  const PARAMS_MAP = {
    latch_force: 'LATCH_FORCE',
    claw_force: 'CLAW_FORCE',
    safety_lever: 'SAFETY_LEVER',
    claw_lever: 'CLAW_LEVER',
    stroke: 'STROKE',
    alarm: 'ALARM',
  }
  for (const [dbCol, paramKey] of Object.entries(PARAMS_MAP)) {
    if (row[dbCol] !== undefined && row[dbCol] !== null) {
      parameters[paramKey] = row[dbCol]
    }
  }

  const product = row.product ?? extra.product ?? null
  const Barcode_details = extra.Barcode_details ?? null

  return {
    _id: row._id,
    companyname: row.company_name,
    plantname: row.plant_name,
    linenumber: row.line_number,
    device_id: row.device_id,
    timestamp: row.timestamp,
    Start_time: row.start_time,
    Stop_time: row.stop_time,
    Status: row.status,
    product,
    production_count: row.production_count ?? extra.PRODUCTION_COUNT ?? null,
    machine: row.model ? { model: row.model } : {},
    parameters,
    Barcode_details,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: map a raw DB row → clean report object
// (same field extraction that was previously in the controller)
// ─────────────────────────────────────────────────────────────────────────────
function mapRowToReport(json) {
  // ── parameters ──
  let params = json.parameters || {}
  if (typeof params === 'string') {
    try {
      params = JSON.parse(params)
    } catch (_) {
      params = {}
    }
  }
  const flatParams = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && typeof v !== 'object') flatParams[k] = v
  }

  // ── barcode ──
  let barcode = json.Barcode_details || null
  if (typeof barcode === 'string') {
    try {
      barcode = JSON.parse(barcode)
    } catch (_) {
      barcode = null
    }
  }
  if (!barcode || typeof barcode !== 'object') barcode = {}

  // ── product ──
  let product = json.product
  if (typeof product === 'string' && (product.startsWith('{') || product.startsWith('['))) {
    try {
      const parsed = JSON.parse(product)
      if (parsed && typeof parsed === 'object') product = parsed
    } catch (_) {
      // Keep as string if parsing fails
    }
  }

  // Product = the part number first (e.g. 37430, 74400, 37460, 82110M74T00).
  // material_code is a generic placeholder ("JPM") on this deployment, so using
  // it first made every row read "JPM" and the distinct count meaningless.
  // Order: part_no → model → product_name → material_code (last resort).
  const finalProduct =
    (product &&
      typeof product === 'object' &&
      (product.part_no || product.model || product.product_name || product.material_code)) ||
    (typeof product === 'string' ? product : null) ||
    null

  return {
    Company: json.companyname ?? null,
    Plant: json.plantname ?? null,
    Product: finalProduct,
    ProductionCount: json.production_count ?? json.PRODUCTION_COUNT ?? null,
    Model:
      (product && typeof product === 'object' && product.model) ||
      (json.machine && json.machine.model) ||
      json.model ||
      null,
    Shift: json.parameters?.SHIFT || json.parameters?.Shift || json.parameters?.shift || null,
    Operator:
      json.parameters?.Operatorname ||
      json.parameters?.OPERATORNAME ||
      json.parameters?.OPERATOR ||
      json.parameters?.operator ||
      null,
    Date: json.timestamp || null,
    LineNumber: json.linenumber ?? null,
    LineName: json.parameters?.linename || json.parameters?.line_name || null,
    BarcodeTag:
      (json.Barcode_details &&
        (json.Barcode_details.BarcodeID || json.Barcode_details.BarcodeTag)) ||
      null,
    BarcodeStatus: json.Barcode_details?.BarcodeStatus || null,
    BarcodeDateTime: json.Barcode_details?.BarcodeDateTime || null,
    Rod: json.parameters?.ROD || json.parameters?.rod || null,
    Striker: json.parameters?.STRIKER || json.parameters?.striker || null,
    Error:
      json.parameters?.ERROR_STATUS ||
      json.parameters?.ERROR_CODE ||
      json.parameters?.error_status ||
      json.parameters?.error_code ||
      null,
    // CalculatedProduction is derived here so the frontend never has to
    CalculatedProduction:
      String(json.parameters?.ERROR_STATUS || json.parameters?.error_status || '')
        .trim()
        .toLowerCase() === 'ok'
        ? 1
        : 0,
    parameters: json.parameters || {},
    timestamp: json.timestamp || null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the Sequelize `where` clause for fields that live in the DB columns
// (company, plant, date range).  Product / status filtering happens in-memory
// after deduplication because those values are inside JSON blobs.
// ─────────────────────────────────────────────────────────────────────────────
function buildDbWhere(filters, Op) {
  const where = {}

  if (filters.device_id) where.device_id = { [Op.like]: `%${filters.device_id}%` }
  if (filters.company_name) where.company_name = filters.company_name // ← exact match
  if (filters.plant_name) where.plant_name = filters.plant_name // ← exact match
  if (filters.model) where.model = filters.model

  // duration/date filters
  const { duration, startDate, endDate, startTime, endTime, timestampStart, timestampEnd } = filters

  if (duration === 'today') {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    where.timestamp = { [Op.gte]: start }
  } else if (duration === 'week') {
    const start = new Date()
    start.setDate(start.getDate() - start.getDay())
    start.setHours(0, 0, 0, 0)
    where.timestamp = { [Op.gte]: start }
  } else if (duration === 'month') {
    const now = new Date()
    where.timestamp = { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1) }
  } else if (duration === 'custom' || (startDate && endDate)) {
    // Handle both preset "custom" and direct ISO strings from frontend
    const start = startDate
      ? new Date(
          String(startDate).includes('T') ? startDate : `${startDate}T${startTime || '00:00'}:00`,
        )
      : null
    const end = endDate
      ? new Date(String(endDate).includes('T') ? endDate : `${endDate}T${endTime || '23:59'}:59`)
      : null

    if (start && end) where.timestamp = { [Op.between]: [start, end] }
    else if (start) where.timestamp = { [Op.gte]: start }
    else if (end) where.timestamp = { [Op.lte]: end }
  } else if (timestampStart && timestampEnd) {
    where.timestamp = { [Op.between]: [timestampStart, timestampEnd] }
  } else if (startDate) {
    where.timestamp = { [Op.gte]: new Date(startDate) }
  } else if (endDate) {
    where.timestamp = { [Op.lte]: new Date(endDate) }
  }

  // Safety net: with no date filter at all, never scan the entire table —
  // default to the most recent window.
  if (!where.timestamp) {
    where.timestamp = { [Op.gte]: defaultWindowStart() }
  }

  return where
}
// ─────────────────────────────────────────────────────────────────────────────
// Main service
// ─────────────────────────────────────────────────────────────────────────────
// Heavy, page-INDEPENDENT report computation: pulls the recent rows, dedups by
// barcode, runs the full-window GROUP BY summary. Depends only on `filters`, so
// the public wrapper below caches its result by filter and reuses it for every
// page. (Renamed from getAllPlcReport; the export name is unchanged below.)
const _computeReportCore = async (filters = {}) => {
  // 1️⃣  Fetch from DB with limited columns and raw=true for maximum speed
  const where = buildDbWhere(filters, Op)
  // Model filter runs on the indexed `model` COLUMN (backfilled from
  // extra_data.product.model and kept in sync on every insert). It is covered by
  // IX_plc_data_model, so filtering stays fast even with Duration = "All Time" —
  // a JSON_VALUE scan has no index and stalls on the full table. buildDbWhere
  // already sets where.model when filters.model is present.
  if (filters.model) where.model = filters.model

  const rawRows = await PlcDataModel.findAll({
    where,
    attributes: [
      '_id',
      'company_name',
      'plant_name',
      'line_number',
      'device_id',
      'timestamp',
      'start_time',
      'stop_time',
      'status',
      'model',
      'production_count',
      'extra_data',
    ],
    order: [['timestamp', 'ASC']],
    raw: true,
    limit: MAX_SCAN_ROWS,
  })

  // 2️⃣  Process and Deduplicate by BarcodeTag in one pass
  const barcodeMap = new Map()

  const parseJson = (val) => {
    if (!val) return null
    if (typeof val === 'object') return val
    try {
      return JSON.parse(val)
    } catch (_) {
      return null
    }
  }

  for (const row of rawRows) {
    const extra = parseJson(row.extra_data) || {}
    const barcodeDetails = parseJson(extra.Barcode_details) || {}

    const barcodeTag =
      barcodeDetails.BarcodeID ??
      barcodeDetails.BarcodeId ??
      barcodeDetails.barcode_id ??
      barcodeDetails.BarcodeTag ??
      null

    if (barcodeTag && !barcodeMap.has(barcodeTag)) {
      barcodeMap.set(barcodeTag, mapRawToPlain(row))
    }
  }

  let deduped = Array.from(barcodeMap.values())

  // 3️⃣  In-memory filters (status only, model is in SQL)
  if (filters.status) {
    const sel = filters.status.trim().toLowerCase()
    deduped = deduped.filter((r) => {
      const extra = r.parameters || {} // we mapped extra_data to parameters above
      const err = String(
        extra.ERROR_STATUS ?? extra.error_status ?? extra.parameters?.ERROR_STATUS ?? 'ok',
      )
        .trim()
        .toLowerCase()
      if (sel === 'ok') return err === 'ok'
      if (sel === 'error') return err !== 'ok'
      return true
    })
  }

  // 4️⃣  Attach products only to the final deduplicated set
  await attachProductToPlcData(deduped)

  // 5️⃣  Map to clean report objects
  const mapped = deduped.map((r) => mapRowToReport(r))

  // 6️⃣  Sort DESC — latest on top (for display)
  mapped.sort((a, b) => new Date(b.Date || b.timestamp) - new Date(a.Date || a.timestamp))

  const total = mapped.length

  // ── Full-window product breakdown — drives BOTH the summary cards AND the
  // "View Summary" modal, so the two can never disagree ──────────────────────
  // Computed in SQL over the SAME where-clause as the report
  // (Company/Plant/Model/Duration), deduped to one row per barcode — NOT from
  // the capped 15 000-row display slice. That slice is why the modal showed only
  // the few recently-running products while the cards counted the whole period
  // (5 vs 34), and why OK/Error never matched the donuts. Product = part_no (the
  // real part number), falling back to model only when part_no is blank.
  // part_no / error_status are indexed columns; barcode_id is the table's
  // existing computed column; error_status carries the OK/NG flag.
  const baseWhereSql = (() => {
    const wq = sequelize.getQueryInterface().queryGenerator.whereQuery(where)
    return wq ? wq.replace(/^WHERE\s+/i, '') : '1=1'
  })()

  // Barcode-status filter (ok / error) lives on the error_status column.
  let statusCond = ''
  if (filters.status) {
    const sel = String(filters.status).trim().toLowerCase()
    if (sel === 'ok') statusCond = " AND LOWER(LTRIM(RTRIM(ISNULL(error_status, 'ok')))) = 'ok'"
    else if (sel === 'error')
      statusCond = " AND LOWER(LTRIM(RTRIM(ISNULL(error_status, 'ok')))) <> 'ok'"
  }

  const productRows = await sequelize.query(
    `WITH d AS (
       SELECT COALESCE(NULLIF(LTRIM(RTRIM(part_no)), ''), NULLIF(LTRIM(RTRIM(model)), ''), '—') AS product,
              LOWER(LTRIM(RTRIM(ISNULL(error_status, 'ok')))) AS err,
              company_name, plant_name, model,
              ROW_NUMBER() OVER (PARTITION BY barcode_id ORDER BY timestamp DESC) AS rn
         FROM plc_data
        WHERE ${baseWhereSql}${statusCond}
          AND barcode_id IS NOT NULL AND barcode_id <> ''
     )
     SELECT product,
            SUM(CASE WHEN err = 'ok'  THEN 1 ELSE 0 END) AS barcodeOk,
            SUM(CASE WHEN err <> 'ok' THEN 1 ELSE 0 END) AS barcodeNg,
            MAX(company_name) AS company,
            MAX(plant_name)   AS plant,
            MAX(model)        AS model
       FROM d
      WHERE rn = 1
      GROUP BY product
      ORDER BY SUM(CASE WHEN err = 'ok' THEN 1 ELSE 0 END) DESC,
               SUM(CASE WHEN err <> 'ok' THEN 1 ELSE 0 END) DESC`,
    { type: Sequelize.QueryTypes.SELECT },
  )

  const productSummaries = productRows.map((r) => ({
    product: r.product,
    totalProduction: Number(r.barcodeOk) || 0, // OK scans = good production
    barcodeOk: Number(r.barcodeOk) || 0,
    barcodeNg: Number(r.barcodeNg) || 0,
    company: r.company || '-',
    plant: r.plant || '-',
    model: r.model || '-',
  }))

  // Cards are exact roll-ups of the same rows → modal totals always reconcile.
  const totalProductCount = productSummaries.length
  const barcodeOkCount = productSummaries.reduce((sum, p) => sum + p.barcodeOk, 0)
  const barcodeNgCount = productSummaries.reduce((sum, p) => sum + p.barcodeNg, 0)
  const totalProduction = barcodeOkCount

  // 8️⃣  Return the heavy, page-independent core. The cached wrapper below
  // paginates this `mapped` array in memory so paging never re-scans the DB.
  return {
    mapped,
    total,
    productSummaries,
    summary: {
      uniqueProducts: totalProductCount,
      barcodeOkCount,
      barcodeNgCount,
      totalProduction,
    },
  }
}

// Public report endpoint. The expensive work above (15k-row pull + JS dedup +
// full-window GROUP BY summary) depends only on the FILTERS, not the page — so
// we compute it once and Redis-cache it by filter (5-min TTL). Every page
// request then just slices the cached `mapped` array in memory. This is why
// opening the Report and paging — or the background prefetch firing pages 2/3 —
// no longer runs the ~18s query several times: only the first request for a
// given filter set pays that cost; the rest are instant cache hits.
export const getAllPlcReport = async (filters = {}, pagination = {}) => {
  const core = await cachedAnalytics(
    'report',
    [filters],
    () => _computeReportCore(filters),
    ANALYTICS_TTL_SECONDS
  )

  const page = Math.max(Number(pagination.page) || 1, 1)
  const limit = Math.min(Number(pagination.limit) || 10, 500)
  const offset = (page - 1) * limit

  return {
    data: core.mapped.slice(offset, offset + limit),
    total: core.total,
    page,
    limit,
    totalPages: Math.ceil(core.total / limit) || 1,
    summary: core.summary,
    productSummaries: core.productSummaries,
  }
}
// How far back the filter dropdowns look. The previous version ran THREE
// unbounded `SELECT DISTINCT` scans over the whole (600k+ row) plc_data table.
// `DISTINCT model` has no index, so that scan was slow enough to stall/time out
// the request — and a failed request makes the frontend render EMPTY dropdowns
// (companies/plants/models all blank). Bounding to a recent window lets these
// use the existing `timestamp` index and return fast.
const REPORT_OPTIONS_WINDOW_DAYS = 90

export const getPlcReportOptionsService = async () => {
  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - REPORT_OPTIONS_WINDOW_DAYS)
  const recent = { timestamp: { [Op.gte]: windowStart } }

  const [companies, plants, modelRows, part_nos] = await Promise.all([
    PlcDataModel.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('company_name')), 'company_name']],
      where: recent,
      raw: true,
    }),
    PlcDataModel.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('plant_name')), 'plant_name']],
      where: recent,
      raw: true,
    }),
    // `model` is now a backfilled, indexed column (IX_plc_data_model) kept in
    // sync on every insert, so a plain DISTINCT on the column is fast and uses
    // the index — unlike the previous JSON_VALUE scan, which stalled on Express
    // and returned an EMPTY dropdown (making the filter look broken).
    sequelize.query(
      `SELECT DISTINCT model
         FROM plc_data
        WHERE timestamp >= DATEADD(day, -${REPORT_OPTIONS_WINDOW_DAYS}, GETDATE())
          AND model IS NOT NULL AND model <> ''`,
      { type: Sequelize.QueryTypes.SELECT },
    ),
    MachineHistoryModel.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('part_no')), 'part_no']],
      raw: true,
    }),
  ])

  return {
    companies: companies.map((c) => c.company_name).filter(Boolean),
    plants: plants.map((p) => p.plant_name).filter(Boolean),
    models: modelRows.map((m) => m.model).filter(Boolean),
    part_nos: part_nos.map((p) => p.part_no).filter(Boolean),
  }
}

export const getPlcListingService = async (filters = {}) => {
  const where = buildDbWhere(filters, Op)

  // Helper to parse JSON safely
  const parseMaybeJson = (value) => {
    if (!value) return null
    if (typeof value === 'object') return value
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (_) {
        return null
      }
    }
    return null
  }

  const asObject = (value) => {
    if (!value) return null
    if (typeof value === 'object') return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return parsed && typeof parsed === 'object' ? parsed : null
      } catch (_) {
        return null
      }
    }
    return null
  }

  const getModel = (row) => {
    const machine = asObject(row?.machine)
    const product = asObject(row?.product)
    return row?.model ?? machine?.model ?? product?.model ?? 'Unknown'
  }

  const getErrorStatus = (plainRow) => {
    const raw =
      plainRow?.parameters?.ERROR_STATUS ??
      plainRow?.parameters?.error_status ??
      plainRow?.ERROR_STATUS ??
      plainRow?.error_status
    return String(raw ?? '')
      .trim()
      .toLowerCase()
  }

  const getBarcodeId = (plainRow) => {
    const rawBarcodeDetails = plainRow?.Barcode_details
    const barcodeDetails = parseMaybeJson(rawBarcodeDetails)
    if (!barcodeDetails || typeof barcodeDetails !== 'object') return null

    const id =
      barcodeDetails?.BarcodeID ??
      barcodeDetails?.BarcodeId ??
      barcodeDetails?.barcode_id ??
      barcodeDetails?.BarcodeTag ??
      null

    const s = id == null ? '' : String(id).trim()
    return s ? s : null
  }

  const norm = (value) =>
    String(value ?? 'Unknown')
      .trim()
      .toLowerCase()

  const modelSel =
    filters.model != null && String(filters.model).trim() !== ''
      ? String(filters.model).trim().toLowerCase()
      : null

  /**
   * OPTIMIZATION:
   * Instead of fetching ALL records and processing in JS, we use two targeted fetches.
   * 1. Latest record per device (using a subquery/window function if possible, or targeted findAll)
   * 2. Aggregated barcode stats
   */

  // 1. Fetch only the latest record for each device matching the filters
  // We use a subquery with ROW_NUMBER() for maximum performance in MSSQL
  const whereQuery = sequelize.getQueryInterface().queryGenerator.whereQuery(where)
  const whereSql = whereQuery ? whereQuery.replace(/^WHERE\s+/i, '') : '1=1'

  const latestRows = await PlcDataModel.findAll({
    where: {
      ...where,
      _id: {
        [Op.in]: Sequelize.literal(`(
            SELECT _id FROM (
              SELECT _id, ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC) as rn
              FROM plc_data
              WHERE ${whereSql}
            ) t WHERE rn = 1
          )`),
      },
    },
    raw: true,
  })

  await attachProductToPlcData(latestRows)
  const latestRowByDeviceList = latestRows.map((r) => mapRawToPlain(r))

  // 2. Production / error barcode counts — fast indexed SQL aggregate.
  //
  // PREVIOUS approach pulled up to MAX_SCAN_ROWS (6000) barcode rows into Node
  // and counted them in JS. Two bugs:
  //   (a) the 6000-row cap made counts wrong for wide windows, and
  //   (b) it reused `where` (buildDbWhere), which injects a 1-day safety-net
  //       default when no date range is given — so "All Time" silently became
  //       "last 1 day" and showed the SAME number as "Today".
  //
  // We now count in SQL over the PERSISTED, indexed columns (barcode_id,
  // error_status, timestamp): no row cap (accurate), and the date predicate is
  // applied ONLY when the caller passes an explicit range — so "All Time" really
  // counts all time, "Today"/"This Week"/"This Month"/custom each scope exactly.
  // First-seen status per barcode (ROW_NUMBER ... ORDER BY timestamp ASC) keeps
  // the same semantics as the old JS loop. The (barcode_id, timestamp) index
  // serves the window ordering, so no extra sort.
  const okCountByDevice = new Map()
  let totalProductionBarcodes = 0
  let totalErrorBarcodes = 0

  // Only compute the (potentially heavy, all-time) barcode counts when the caller
  // actually wants the summary. The dropdown-options call hits this same endpoint
  // with NO summary requested — without this guard it would needlessly run the
  // full-table all-time aggregate and stall, leaving Company/Plant dropdowns empty
  // until it resolved.
  if (filters.includeSummary) {
    const countConds = ['barcode_id IS NOT NULL']
    const countRepl = {}
    if (filters.device_id) {
      countConds.push('device_id LIKE :c_device')
      countRepl.c_device = `%${filters.device_id}%`
    }
    if (modelSel) {
      countConds.push('LOWER(LTRIM(RTRIM(model))) = :c_model')
      countRepl.c_model = modelSel
    }
    if (filters.company_name) {
      countConds.push('company_name = :c_company')
      countRepl.c_company = filters.company_name
    }
    if (filters.plant_name) {
      countConds.push('plant_name = :c_plant')
      countRepl.c_plant = filters.plant_name
    }
    // Explicit date range only — NO 1-day default (that is the whole point of the fix).
    if (filters.startDate) {
      countConds.push('timestamp >= :c_start')
      countRepl.c_start = new Date(filters.startDate)
    }
    if (filters.endDate) {
      countConds.push('timestamp <= :c_end')
      countRepl.c_end = new Date(filters.endDate)
    }
    if (filters.timestampStart) {
      countConds.push('timestamp >= :c_tss')
      countRepl.c_tss = new Date(filters.timestampStart)
    }
    if (filters.timestampEnd) {
      countConds.push('timestamp <= :c_tse')
      countRepl.c_tse = new Date(filters.timestampEnd)
    }
    const countWhereSql = countConds.join(' AND ')

    // Cache the (potentially full-table for "All Time") aggregate for 60s, keyed by
    // the exact filters that affect it. Keeps the live dashboard fresh while
    // shielding the 1 GB SQL Express box from repeated heavy scans on refetch
    // bursts. Falls back to a direct query automatically if Redis is unavailable.
    const perDeviceCounts = await cachedAnalytics(
      'listing-counts',
      [{
        device_id: filters.device_id ?? '',
        model: modelSel ?? '',
        company_name: filters.company_name ?? '',
        plant_name: filters.plant_name ?? '',
        startDate: filters.startDate ?? '',
        endDate: filters.endDate ?? '',
        timestampStart: filters.timestampStart ?? '',
        timestampEnd: filters.timestampEnd ?? '',
      }],
      () =>
        sequelize.query(
          `WITH first_seen AS (
       SELECT device_id, error_status,
              ROW_NUMBER() OVER (PARTITION BY barcode_id ORDER BY timestamp ASC) AS rn
       FROM plc_data
       WHERE ${countWhereSql}
     )
     SELECT device_id,
            SUM(CASE WHEN LOWER(LTRIM(RTRIM(error_status))) = 'ok' THEN 1 ELSE 0 END) AS ok_count,
            SUM(CASE WHEN error_status IS NULL OR LOWER(LTRIM(RTRIM(error_status))) <> 'ok' THEN 1 ELSE 0 END) AS err_count
     FROM first_seen
     WHERE rn = 1
     GROUP BY device_id`,
          { replacements: countRepl, type: Sequelize.QueryTypes.SELECT },
        ),
      60,
    )

    for (const r of perDeviceCounts) {
      const ok = Number(r.ok_count || 0)
      const err = Number(r.err_count || 0)
      totalProductionBarcodes += ok
      totalErrorBarcodes += err
      okCountByDevice.set(norm(r.device_id), ok)
    }
  }

  let result = latestRowByDeviceList.map((row) => ({
    ...row,
    production_count: okCountByDevice.get(norm(row.device_id)) || 0,
  }))

  // Apply final filters
  if (filters.status) {
    const sel = String(filters.status).toLowerCase()
    result = result.filter((r) => String(r?.Status ?? r?.status ?? '').toLowerCase() === sel)
  }

  if (modelSel) {
    result = result.filter((r) => String(getModel(r)).trim().toLowerCase() === modelSel)
  }

  return {
    rows: result,
    summary: {
      total_production_barcodes: totalProductionBarcodes,
      total_error_barcodes: totalErrorBarcodes,
    },
  }
}
// Shorter TTL: this also feeds the Live Dashboard fleet-count cards, so keep
// it ~1 min fresh rather than the 5-min window used by the heavy charts.
const STOPPAGE_TTL_SECONDS = 60
export const getMachineStoppageService = (filters = {}, pagination = {}) =>
  cachedAnalytics(
    'stoppage',
    [filters, pagination],
    () => _getMachineStoppageServiceImpl(filters, pagination),
    STOPPAGE_TTL_SECONDS
  )

// Cap each reading-to-reading gap when summing state time. Machines here report
// every few seconds, so real stoppages are made of many tiny gaps (summed
// accurately); a much larger gap means lost data/connectivity, not one
// continuous stoppage — capping it prevents a data hole from inflating downtime.
// Tune to your reporting interval (e.g. raise if machines report less often).
const STATE_GAP_CAP_SEC = 600 // 10 min

const _getMachineStoppageServiceImpl = async (filters = {}, pagination = {}) => {
  const page = Math.max(pagination.page || 1, 1)
  const limit = Math.min(pagination.limit || 100, 500)
  const offset = (page - 1) * limit

  const hasStoppageDateFilter = Boolean(filters.from_date && filters.to_date)
  const replacements = {}

  // Window + optional machine filter for the per-machine downtime aggregation.
  // NOTE: no `stop_time IS NOT NULL` here — we need EVERY reading to measure how
  // long each machine sat in 'stopped' state from the status+timestamp sequence.
  let windowWhere = 'WHERE 1=1'
  if (filters.machine_name) {
    windowWhere += ' AND (device_id LIKE :machine_name OR model LIKE :machine_name)'
    replacements.machine_name = `%${filters.machine_name}%`
  }
  if (hasStoppageDateFilter) {
    windowWhere += ' AND timestamp BETWEEN :from_date AND :to_date'
    replacements.from_date = filters.from_date
    replacements.to_date = filters.to_date
  } else {
    windowWhere += ' AND timestamp >= :default_from'
    replacements.default_from = defaultWindowStart()
  }

  // Describe the active period so the UI can label the downtime ("Last 24 hours"
  // by default, or the chosen From→To range). Single source of truth = here, so
  // the label always matches whatever DEFAULT_QUERY_WINDOW_DAYS is set to.
  const windowInfo = {
    isDefault: !hasStoppageDateFilter,
    days: hasStoppageDateFilter ? null : DEFAULT_QUERY_WINDOW_DAYS,
    from: hasStoppageDateFilter ? filters.from_date : defaultWindowStart(),
    to: hasStoppageDateFilter ? filters.to_date : new Date(),
  }

  // Fleet count cards (Total / Stopped / Running machines) — current fleet,
  // all-time (no default window), exactly as before.
  let fleetWhereClause = 'WHERE 1=1'
  if (filters.machine_name) {
    fleetWhereClause += ' AND (device_id LIKE :machine_name OR model LIKE :machine_name)'
  }
  if (hasStoppageDateFilter) {
    fleetWhereClause += ' AND timestamp BETWEEN :from_date AND :to_date'
  }

  // ── Per-machine downtime over the window ─────────────────────────────────
  // Computed from the STATUS + TIMESTAMP sequence, NOT start_time/stop_time
  // (those are unreliable on this data — many 'stopped' rows have start_time
  // AFTER stop_time). For each consecutive pair of a device's readings we
  // attribute the time gap to the earlier reading's status; summing the
  // 'stopped' gaps gives downtime (and 'running' gaps give runtime). Each gap
  // is capped at STATE_GAP_CAP_SEC. Fully covered by
  // IX_plc_data_device_ts (device_id, timestamp) INCLUDE (status).
  const overviewQuery = `
    WITH bounded AS (
      SELECT device_id, model, company_name, status, timestamp
      FROM plc_data
      ${windowWhere}
    ),
    seq AS (
      SELECT device_id, model, company_name, status, timestamp,
             LEAD(timestamp) OVER (PARTITION BY device_id ORDER BY timestamp) AS next_ts,
             ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC) AS rn_latest
      FROM bounded
    )
    SELECT
      device_id,
      MAX(model)        AS model,
      MAX(company_name) AS company_name,
      MAX(CASE WHEN rn_latest = 1 THEN status END) AS current_status,
      MAX(timestamp)    AS last_seen,
      SUM(
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(status, '')))) = 'stopped' AND next_ts IS NOT NULL
             THEN CASE WHEN DATEDIFF(SECOND, timestamp, next_ts) > ${STATE_GAP_CAP_SEC}
                       THEN ${STATE_GAP_CAP_SEC}
                       ELSE DATEDIFF(SECOND, timestamp, next_ts) END
             ELSE 0 END
      ) AS downtime_sec,
      SUM(
        CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(status, '')))) = 'running' AND next_ts IS NOT NULL
             THEN CASE WHEN DATEDIFF(SECOND, timestamp, next_ts) > ${STATE_GAP_CAP_SEC}
                       THEN ${STATE_GAP_CAP_SEC}
                       ELSE DATEDIFF(SECOND, timestamp, next_ts) END
             ELSE 0 END
      ) AS runtime_sec
    FROM seq
    GROUP BY device_id
    ORDER BY downtime_sec DESC, device_id ASC;
  `

  const latestStatusCTE = (statusValue) => `
    WITH LatestStatus AS (
      SELECT device_id, status,
             ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY timestamp DESC, created_at DESC) as rn
      FROM plc_data
      ${fleetWhereClause}
    )
    SELECT COUNT(*) as count
    FROM LatestStatus
    WHERE rn = 1 AND LOWER(LTRIM(RTRIM(COALESCE(status, '')))) = '${statusValue}';
  `

  const [
    overviewRows,
    [totalMachinesResult],
    [totalStoppedMachinesResult],
    [totalRunningMachinesResult],
    allDevicesResult,
  ] = await Promise.all([
    sequelize.query(overviewQuery, { replacements, type: Sequelize.QueryTypes.SELECT }),
    sequelize.query(`SELECT COUNT(DISTINCT device_id) as count FROM plc_data ${fleetWhereClause}`, {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    }),
    sequelize.query(latestStatusCTE('stopped'), { replacements, type: Sequelize.QueryTypes.SELECT }),
    sequelize.query(latestStatusCTE('running'), { replacements, type: Sequelize.QueryTypes.SELECT }),
    sequelize.query(`SELECT DISTINCT device_id FROM plc_data ${fleetWhereClause} AND device_id IS NOT NULL`, {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    }),
  ])

  // Build per-machine rows and roll the Total Downtime card up from the SAME
  // set, so the card always equals the sum of the table's downtime column.
  const machines = (overviewRows || []).map((r) => ({
    device_id: r.device_id,
    machine: r.model || r.device_id || '—',
    company: r.company_name || '—',
    status: r.current_status || 'stopped',
    downtimeMinutes: Math.round((Number(r.downtime_sec) || 0) / 60),
    runtimeMinutes: Math.round((Number(r.runtime_sec) || 0) / 60),
    lastSeen: r.last_seen,
  }))

  const totalDowntime = machines.reduce((sum, m) => sum + m.downtimeMinutes, 0)
  const total = machines.length
  const pageRows = machines.slice(offset, offset + limit)

  const totalMachines = totalMachinesResult?.count || 0
  const totalStoppedMachines = totalStoppedMachinesResult?.count || 0
  const totalRunningMachines = totalRunningMachinesResult?.count || 0
  const allDevices = allDevicesResult?.map((d) => d.device_id) || []

  return {
    data: pageRows,
    totalMachines,
    totalStoppedMachines,
    totalRunningMachines,
    totalDowntime, // minutes — equals the sum of the table's Downtime column
    allDevices,
    window: windowInfo,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}
export const getPlcDataByIdService = async (id) => {
  const plcData = await PlcDataModel.findByPk(id)
  if (!plcData) {
    throw new NotFoundError('PLC Data not found', 'getPlcDataByIdService()')
  }
  await attachProductToPlcData(plcData)
  return plcData
}

export const updatePlcDataService = async (id, data) => {
  const plcData = await PlcDataModel.findByPk(id)
  if (!plcData) {
    throw new NotFoundError('PLC Data not found', 'updatePlcDataService()')
  }

  const flat = flattenPayload(data)
  const { known, extra } = extractKnownAndExtra(flat)

  const updateData = { ...known }
  if (Object.keys(extra).length) {
    updateData.extra_data = { ...(plcData.extra_data || {}), ...extra }
  }

  plcData.set(updateData)
  const changedFields = plcData.changed()
  if (!changedFields || changedFields.length === 0) {
    await attachProductToPlcData(plcData)
    return {
      data: plcData,
      isUpdated: false,
    }
  }

  await plcData.save()
  await attachProductToPlcData(plcData)

  return {
    data: plcData,
    isUpdated: true,
  }
}

export const deletePlcDataService = async (id) => {
  const plcData = await PlcDataModel.findByPk(id)
  if (!plcData) {
    throw new NotFoundError('PLC Data not found', 'deletePlcDataService()')
  }

  await plcData.destroy()
  return true
}

export const getPlcErrorDistributionService = (filters = {}) =>
  cachedAnalytics('errorDist', [filters], () =>
    _getPlcErrorDistributionServiceImpl(filters)
  )

const _getPlcErrorDistributionServiceImpl = async (filters = {}) => {
  const where = {}

  if (filters.startDate && filters.endDate) {
    where.created_at = {
      [Op.between]: [filters.startDate, filters.endDate],
    }
  }

  if (filters.companyName) {
    where.company_name = {
      [Op.like]: `%${filters.companyName}%`,
    }
  }

  if (filters.plantName) {
    where.plant_name = {
      [Op.like]: `%${filters.plantName}%`,
    }
  }

  if (filters.deviceId) {
    where.device_id = {
      [Op.like]: `%${filters.deviceId}%`,
    }
  }

  if (filters.model) {
    where.model = {
      [Op.like]: `%${filters.model}%`,
    }
  }

  const results = await PlcDataModel.findAll({
    attributes: [
      [Sequelize.literal("JSON_VALUE(extra_data, '$.ERROR_CODE')"), 'name'],
      [Sequelize.fn('COUNT', Sequelize.col('_id')), 'value'],
    ],
    where: {
      ...where,
    },
    group: [Sequelize.literal("JSON_VALUE(extra_data, '$.ERROR_CODE')")],
    raw: true,
  })

  return results.filter((item) => item.name)
}

export const getPlcDowntimeByMachineService = (filters = {}) =>
  cachedAnalytics('downtimeByMachine', [filters], () =>
    _getPlcDowntimeByMachineServiceImpl(filters)
  )

const _getPlcDowntimeByMachineServiceImpl = async (filters = {}) => {
  const where = {}

  // If status is 'Stopped' or 'Stop', then stop_time - start_time is downtime.
  // We need to filter by status or just check where stop_time is not null?
  // User said "stoppage jo meri stopped time aa rha h".
  // Let's assume records with non-null stop_time contribute to downtime,
  // or specifically status='Stopped'.
  // However, often stop_time - start_time IS the duration of the state.
  // If status is 'Running', it's runtime. If 'Stopped', it's downtime.

  // Let's try to filter for status NOT 'Running' (case insensitive)
  where.status = {
    [Op.notLike]: 'Running',
  }
  // Or maybe better: where status LIKE 'Stop%' or similar.
  // Let's assume anything NOT Running is downtime for now, or check for non-null Stop_time.
  // But wait, if Stop_time is present, it means the cycle finished.
  // If Status was 'Running' during that cycle, then Stop - Start is Run Time.
  // If Status was 'Stopped', then Stop - Start is Stop Time.
  // So we must filter by Status = 'Stopped' or similar.

  // Refined Logic:
  // 1. Filter by date range
  if (filters.startDate && filters.endDate) {
    where.created_at = {
      [Op.between]: [filters.startDate, filters.endDate],
    }
  }

  if (filters.companyName) where.company_name = { [Op.like]: `%${filters.companyName}%` }
  if (filters.plantName) where.plant_name = { [Op.like]: `%${filters.plantName}%` }
  if (filters.deviceId) where.device_id = { [Op.like]: `%${filters.deviceId}%` }
  if (filters.model) where.model = { [Op.like]: `%${filters.model}%` }

  // 2. Filter for Stopped status
  // We'll search for status containing 'Stop' or 'Error' or 'Alarm'?
  // User specifically said "stopped time aa rha h".
  // Let's assume status='Stopped'.
  // But to be safe, let's include anything that is not 'Running'.
  // Actually, let's stick to what the user implies: downtime.
  const downtimeQuery = `
    WITH UniqueData AS (
      SELECT *,
             ROW_NUMBER() OVER (
               PARTITION BY device_id, start_time, stop_time
               ORDER BY start_time DESC
             ) AS rn
      FROM plc_data
      WHERE stop_time IS NOT NULL
        ${filters.startDate && filters.endDate ? `AND start_time BETWEEN '${filters.startDate}' AND '${filters.endDate}'` : ''}
        ${filters.deviceId ? `AND device_id LIKE '%${filters.deviceId}%'` : ''}
        ${filters.model ? `AND model LIKE '%${filters.model}%'` : ''}
        ${filters.companyName ? `AND company_name LIKE '%${filters.companyName}%'` : ''}
        ${filters.plantName ? `AND plant_name LIKE '%${filters.plantName}%'` : ''}
    ),
    FilteredData AS (
      SELECT *
      FROM UniqueData
      WHERE rn = 1
    ),
    GapCalculated AS (
      SELECT *,
             LAG(stop_time) OVER (
               PARTITION BY device_id
               ORDER BY start_time
             ) AS prev_stop_time
      FROM FilteredData
    ),
    FinalData AS (
      SELECT *,
             CASE 
               WHEN prev_stop_time IS NOT NULL AND DATEDIFF(SECOND, prev_stop_time, start_time) > 0 
               THEN DATEDIFF(MINUTE, prev_stop_time, start_time) 
               ELSE 0 
             END AS stopped_duration_minutes
      FROM GapCalculated
    )
    SELECT 
      device_id AS name,
      SUM(stopped_duration_minutes) AS value
    FROM FinalData
    WHERE prev_stop_time IS NOT NULL
    GROUP BY device_id
    ORDER BY value DESC;
  `

  const results = await sequelize.query(downtimeQuery, {
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  })

  return results.map((r) => ({
    name: r.name,
    value: r.value,
  }))
}

export const getPlcTimeDistributionService = (filters = {}) =>
  cachedAnalytics('timeDist', [filters], () =>
    _getPlcTimeDistributionServiceImpl(filters)
  )

const _getPlcTimeDistributionServiceImpl = async (filters = {}) => {
  const where = {}

  if (filters.device_id) where.device_id = { [Op.like]: `%${filters.device_id}%` }
  if (filters.model) where.model = { [Op.like]: `%${filters.model}%` }
  if (filters.status) where.status = { [Op.like]: `%${filters.status}%` }
  if (filters.company_name) where.company_name = { [Op.like]: `%${filters.company_name}%` }
  if (filters.plant_name) where.plant_name = { [Op.like]: `%${filters.plant_name}%` }

  if (filters.startDate && filters.endDate) {
    where.created_at = { [Op.between]: [filters.startDate, filters.endDate] }
  }
  if (filters.timestampStart && filters.timestampEnd) {
    where.timestamp = { [Op.between]: [filters.timestampStart, filters.timestampEnd] }
  }

  // Same data scope as PlcStoppage: order timestamp DESC, limit 1000 when no date filter.
  // Was previously `created_at DESC` — but there is no index on created_at, so
  // SQL Server had to sort the result set in memory after filtering by timestamp.
  // `timestamp` and `created_at` are effectively equivalent for PLC rows
  // (created_at is auto-set on insert) and `timestamp` already has an index
  // (IX_plc_data_timestamp), turning the sort into an index seek.
  const queryOpts = {
    attributes: [
      '_id',
      'device_id',
      'start_time',
      'stop_time',
      'timestamp',
      'production_count',
      'status',
      'created_at',
    ],
    where,
    order: [['timestamp', 'DESC']],
    raw: true,
  }
  if (!filters.startDate || !filters.endDate) {
    queryOpts.limit = 1000
  }
  const records = await PlcDataModel.findAll(queryOpts)

  // Normalize like PlcStoppage: _ts = timestamp || created_at || start_time
  const allRecords = records.map((r) => {
    const ts = r.timestamp || r.created_at || r.start_time
    return {
      ...r,
      _ts: ts ? new Date(ts).getTime() : 0,
      _start: r.start_time ? new Date(r.start_time).getTime() : null,
      _stop: r.stop_time ? new Date(r.stop_time).getTime() : null,
    }
  })

  let totalRunMins = 0
  let totalStopMins = 0
  let totalIdleMins = 0

  const grouped = {}
  allRecords.forEach((r) => {
    const dId = r.device_id || 'unknown'
    if (!grouped[dId]) grouped[dId] = []
    grouped[dId].push(r)
  })

  Object.keys(grouped).forEach((deviceId) => {
    const group = grouped[deviceId].sort((a, b) => a._ts - b._ts)

    // A) Sessions - same as PlcStoppage (Run/Stop from session status, gaps -> Stop)
    const sessions = group.filter((r) => r.start_time || r.stop_time)

    sessions.forEach((row, index) => {
      const start = row.start_time
        ? new Date(row.start_time).getTime()
        : row.timestamp
          ? new Date(row.timestamp).getTime()
          : 0
      const stop = row.stop_time ? new Date(row.stop_time).getTime() : null
      const statusLower = (row.status || '').toLowerCase()
      const durationMins = start && stop && stop > start ? (stop - start) / 60000 : 0

      if (durationMins > 0) {
        if (statusLower.includes('stop')) {
          totalRunMins += durationMins
        } else {
          totalStopMins += durationMins
        }
      }

      if (index > 0) {
        const prev = sessions[index - 1]
        if (prev._stop && row._start && row._start > prev._stop) {
          totalStopMins += (row._start - prev._stop) / 60000
        }
      }
    })

    // B) Idle - production_count same for 30+ sec (same as PlcStoppage)
    let lastProdCount = -1
    let lastProdChangeTime = 0
    let isIdling = false
    let idleStartTs = 0

    group.forEach((r) => {
      const currentTs = r._ts
      const currentProd = r.production_count
      if (!currentTs) return
      const currProd = currentProd != null ? currentProd : lastProdCount

      if (lastProdCount === -1) {
        lastProdCount = currProd
        lastProdChangeTime = currentTs
        return
      }

      if (currProd !== lastProdCount) {
        if (isIdling) {
          const durationMins = (currentTs - idleStartTs) / 60000
          if (durationMins > 0) totalIdleMins += durationMins
          isIdling = false
        }
        lastProdCount = currProd
        lastProdChangeTime = currentTs
      } else {
        const diffMs = currentTs - lastProdChangeTime
        if (!isIdling && diffMs > 30000) {
          isIdling = true
          idleStartTs = lastProdChangeTime + 30000
        }
      }
    })

    if (isIdling && group.length > 0) {
      const lastRecord = group[group.length - 1]
      const endTs = lastRecord._ts
      if (endTs > idleStartTs) {
        totalIdleMins += (endTs - idleStartTs) / 60000
      }
    }
  })

  return {
    runTime: Math.round(totalRunMins),
    stopTime: Math.round(totalStopMins),
    idleTime: Math.round(totalIdleMins),
  }
}

export const getMachinePerformanceService = async (filters = {}) => {
  const { startDate, endDate, companyName, plantName, deviceId, model } = filters

  // We use the SQL logic provided by the user, adapted for our schema and including filters.
  // The logic identifies Best/Worst machines based on Running Time (Running -> Stopped transitions)
  // and Production Count.

  const performanceQuery = `
    WITH StatusData AS ( 
      SELECT device_id, model, status, timestamp, production_count,
             LAG(status) OVER (PARTITION BY device_id ORDER BY timestamp) AS prev_status, 
             LAG(timestamp) OVER (PARTITION BY device_id ORDER BY timestamp) AS prev_time 
      FROM plc_data 
      WHERE 1=1
      ${startDate && endDate ? `AND timestamp BETWEEN :startDate AND :endDate` : ''}
      ${companyName ? `AND company_name = :companyName` : ''}
      ${plantName ? `AND plant_name = :plantName` : ''}
      ${deviceId ? `AND device_id = :deviceId` : ''}
      ${model ? `AND model = :model` : ''}
    ), 
    
    RunningTimeCalc AS ( 
      SELECT 
        device_id, 
        model as machine_name, 
        DATEDIFF(MINUTE, prev_time, timestamp) AS running_minutes, 
        production_count 
      FROM StatusData 
      WHERE prev_status = 'Running' AND status = 'Stopped' 
    ), 
    
    Aggregated AS ( 
      SELECT 
        device_id, 
        machine_name, 
        SUM(ISNULL(running_minutes, 0)) AS total_running_time, 
        SUM(ISNULL(production_count, 0)) AS total_production 
      FROM RunningTimeCalc 
      GROUP BY device_id, machine_name 
    ) 
    SELECT * FROM Aggregated;
  `

  const replacements = {}
  if (startDate) replacements.startDate = startDate
  if (endDate) replacements.endDate = endDate
  if (companyName) replacements.companyName = companyName
  if (plantName) replacements.plantName = plantName
  if (deviceId) replacements.deviceId = deviceId
  if (model) replacements.model = model

  const results = await sequelize.query(performanceQuery, {
    replacements,
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  })

  if (!results || results.length === 0) {
    return {
      best_machine: null,
      worst_machine: null,
    }
  }

  // Find Best Machine: MAX(total_running_time) then MAX(total_production)
  const bestMachine = [...results].sort((a, b) => {
    if (b.total_running_time !== a.total_running_time) {
      return b.total_running_time - a.total_running_time
    }
    return b.total_production - a.total_production
  })[0]

  // Find Worst Machine: MIN(total_running_time) then MIN(total_production)
  const worstMachine = [...results].sort((a, b) => {
    if (a.total_running_time !== b.total_running_time) {
      return a.total_running_time - b.total_running_time
    }
    return a.total_production - b.total_production
  })[0]

  return {
    best_machine: {
      machine_name: bestMachine.machine_name,
      total_running_time: bestMachine.total_running_time,
      total_production: bestMachine.total_production,
    },
    worst_machine: {
      machine_name: worstMachine.machine_name,
      total_running_time: worstMachine.total_running_time,
      total_production: worstMachine.total_production,
    },
  }
}

export const getPlcDowntimeByErrorService = (filters = {}) =>
  cachedAnalytics('downtimeByError', [filters], () =>
    _getPlcDowntimeByErrorServiceImpl(filters)
  )

const _getPlcDowntimeByErrorServiceImpl = async (filters = {}) => {
  const { startDate, endDate, companyName, plantName, deviceId, model } = filters

  let whereClause =
    "WHERE status = 'Stopped' AND stop_time IS NOT NULL AND JSON_VALUE(extra_data, '$.Error') IS NOT NULL AND JSON_VALUE(extra_data, '$.Error') <> ''"
  const replacements = {}

  if (startDate && endDate) {
    whereClause += ' AND start_time BETWEEN :startDate AND :endDate'
    replacements.startDate = startDate
    replacements.endDate = endDate
  }

  if (companyName) {
    whereClause += ' AND company_name LIKE :companyName'
    replacements.companyName = `%${companyName}%`
  }

  if (plantName) {
    whereClause += ' AND plant_name LIKE :plantName'
    replacements.plantName = `%${plantName}%`
  }

  if (deviceId) {
    whereClause += ' AND device_id LIKE :deviceId'
    replacements.deviceId = `%${deviceId}%`
  }

  if (model) {
    whereClause += ' AND model LIKE :model'
    replacements.model = `%${model}%`
  }

  const query = `
    SELECT 
      UPPER(LTRIM(RTRIM(JSON_VALUE(extra_data, '$.Error')))) AS error_name, 
      SUM(DATEDIFF(MINUTE, start_time, stop_time)) AS total_downtime 
    FROM plc_data 
    ${whereClause}
    GROUP BY UPPER(LTRIM(RTRIM(JSON_VALUE(extra_data, '$.Error')))) 
    ORDER BY total_downtime DESC;
  `

  const results = await sequelize.query(query, {
    replacements,
    type: Sequelize.QueryTypes.SELECT,
    raw: true,
  })

  return results.map((r) => ({
    error_name: r.error_name,
    total_downtime: r.total_downtime,
  }))
}

export const getPlcDowntimeByErrorStatusService = (filters = {}) =>
  cachedAnalytics('downtimeByErrorStatus', [filters], () =>
    _getPlcDowntimeByErrorStatusServiceImpl(filters)
  )

const _getPlcDowntimeByErrorStatusServiceImpl = async (filters = {}) => {
  // This card should show "how many errors" per ERROR_STATUS (NOT downtime minutes),
  // and it must align with the same error-count logic used in the dashboard summary.
  const { startDate, endDate, companyName, plantName, deviceId, model } = filters

  const where = {}
  if (startDate && endDate) {
    // UI date range is treated as "created_at" range across PLC dashboards.
    where.created_at = { [Op.between]: [startDate, endDate] }
  } else if (startDate) {
    where.created_at = { [Op.gte]: startDate }
  } else if (endDate) {
    where.created_at = { [Op.lte]: endDate }
  } else {
    // Safety: never scan the whole table for the error-status card.
    where.created_at = { [Op.gte]: defaultWindowStart() }
  }

  if (companyName) where.company_name = { [Op.like]: `%${companyName}%` }
  if (plantName) where.plant_name = { [Op.like]: `%${plantName}%` }
  if (deviceId) where.device_id = { [Op.like]: `%${deviceId}%` }
  if (model) where.model = { [Op.like]: `%${model}%` }

  const toPlain = (row) => (row?.toJSON ? row.toJSON() : row)

  const parseMaybeJson = (value) => {
    if (!value) return null
    if (typeof value === 'object') return value
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (_) {
        return null
      }
    }
    return null
  }

  const getModel = (row) => {
    const machine = row?.machine
    const product = row?.product
    return row?.model ?? machine?.model ?? product?.model ?? 'Unknown'
  }

  const getErrorStatus = (plainRow) => {
    const raw =
      plainRow?.parameters?.ERROR_STATUS ??
      plainRow?.parameters?.error_status ??
      plainRow?.ERROR_STATUS ??
      plainRow?.error_status
    return String(raw ?? '')
      .trim()
      .toLowerCase()
  }

  const getBarcodeId = (plainRow) => {
    const rawBarcodeDetails = plainRow?.Barcode_details
    const barcodeDetails = parseMaybeJson(rawBarcodeDetails)
    if (!barcodeDetails || typeof barcodeDetails !== 'object') return null

    const id =
      barcodeDetails?.BarcodeID ??
      barcodeDetails?.BarcodeId ??
      barcodeDetails?.barcode_id ??
      barcodeDetails?.BarcodeTag ??
      null

    const s = id == null ? '' : String(id).trim()
    return s ? s : null
  }

  const modelSel =
    model != null && String(model).trim() !== '' ? String(model).trim().toLowerCase() : null

  // Fetch ordered like `getPlcListingService` so our "latest barcode per id"
  // matches the dashboard summary's logic.
  const rows = await PlcDataModel.findAll({
    where,
    order: [['timestamp', 'ASC']],
    limit: MAX_SCAN_ROWS,
  })

  await attachProductToPlcData(rows)

  const latestBarcodeById = new Map()
  for (const row of rows) {
    const plainRow = toPlain(row)
    const barcodeId = getBarcodeId(plainRow)
    if (!barcodeId) continue

    if (modelSel) {
      const m = String(getModel(plainRow)).trim().toLowerCase()
      if (m !== modelSel) continue
    }

    if (!latestBarcodeById.has(barcodeId)) {
      latestBarcodeById.set(barcodeId, plainRow)
    }
  }

  const countsByStatus = new Map() // ERROR_STATUS -> count
  const modelsByStatus = new Map() // ERROR_STATUS -> Map(model -> count)

  for (const latestRow of latestBarcodeById.values()) {
    const status = getErrorStatus(latestRow)
    if (!status || status === 'ok') continue

    const error_status = status.toUpperCase()
    countsByStatus.set(error_status, (countsByStatus.get(error_status) || 0) + 1)

    const modelVal = String(getModel(latestRow) ?? 'Unknown').trim() || 'Unknown'
    if (!modelsByStatus.has(error_status)) modelsByStatus.set(error_status, new Map())
    const mm = modelsByStatus.get(error_status)
    mm.set(modelVal, (mm.get(modelVal) || 0) + 1)
  }

  const results = Array.from(countsByStatus.entries()).map(([error_status, total_errors]) => {
    const modelsMap = modelsByStatus.get(error_status) || new Map()
    const top_models = Array.from(modelsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([m, c]) => ({ model: m, count: c }))

    return { error_status, total_errors, top_models }
  })

  results.sort((a, b) => b.total_errors - a.total_errors)
  return results
}