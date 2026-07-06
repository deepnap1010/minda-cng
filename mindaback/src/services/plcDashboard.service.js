// src/services/plcDashboard.service.js
import { Op, Sequelize } from 'sequelize'
import { PlcDashboardModel } from '../models/plcDashboard.model.js'

/**
 * Lightweight attributes for list/grid views.
 *
 * NOTE on extra_data: this was previously excluded as a "heavy JSON column",
 * but the Live Data / PLC Dashboard cards on the frontend depend on
 * `parameters` (built from extra_data) to render the "LIVE DATA" section
 * inside each card. Without it the section stays empty. We keep pagination
 * (limit ~6) so this only loads JSON for the page-sized window — the cost
 * is negligible compared to the rendering it unlocks.
 */
const DASHBOARD_ATTRIBUTES = [
  '_id',
  'device_id',
  'company_name',
  'plant_name',
  'line_number',
  'timestamp',
  'start_time',
  'stop_time',
  'status',
  'production_count',
  'model',
  'last_updated',
  // Newly added — needed so cards can show parameters + force/lever values:
  'latch_force',
  'claw_force',
  'safety_lever',
  'claw_lever',
  'stroke',
  'alarm',
  'extra_data',
]

/**
 * Map a raw plc_dashboard row to the shape the frontend cards expect.
 *
 * Why this exists: the DB schema is snake_case (company_name, plant_name,
 * line_number) but PlcLiveData.jsx and the dashboard cards read camelCase
 * (companyname, plantname, linenumber). Without this map the cards would
 * show "N/A" for every machine even though the data is present.
 *
 * Also flattens `extra_data` JSON into a `parameters` object — that's what
 * the "LIVE DATA" section inside each card iterates over.
 */
const PARAMS_MAP_FROM_COLUMNS = {
  latch_force: 'LATCH_FORCE',
  claw_force: 'CLAW_FORCE',
  safety_lever: 'SAFETY_LEVER',
  claw_lever: 'CLAW_LEVER',
  stroke: 'STROKE',
  alarm: 'ALARM',
}

function mapDashboardRow(row) {
  if (!row) return row

  // 1) Parse extra_data — Sequelize may return it as an object or as a JSON string.
  let extra = row.extra_data || {}
  if (typeof extra === 'string') {
    try {
      extra = JSON.parse(extra)
    } catch (_) {
      extra = {}
    }
  }

  // 2) Build the `parameters` object — primitives only, exclude nested
  // objects (product/Barcode_details handled separately).
  const parameters = {}
  for (const [key, value] of Object.entries(extra)) {
    if (key === 'product' || key === 'PRODUCTION_COUNT' || key === 'Barcode_details') continue
    if (value !== null && typeof value !== 'object') {
      parameters[key] = value
    }
  }
  // Surface the typed DB columns into parameters too (LATCH_FORCE etc.) so
  // the "LIVE DATA" section shows them even for older rows whose extra_data
  // didn't include them.
  for (const [dbCol, paramKey] of Object.entries(PARAMS_MAP_FROM_COLUMNS)) {
    if (row[dbCol] !== undefined && row[dbCol] !== null) {
      parameters[paramKey] = row[dbCol]
    }
  }

  // 3) Product info: prefer the nested product from extra_data, fall back
  // to the bare `model` column so the cards' Model field still fills.
  const product =
    (extra && typeof extra.product === 'object' && extra.product) ||
    (row.model ? { model: row.model } : null)

  const Barcode_details =
    extra && typeof extra.Barcode_details === 'object' ? extra.Barcode_details : null

  return {
    _id: row._id,
    device_id: row.device_id,

    // snake_case kept (for any consumer still using these)
    company_name: row.company_name,
    plant_name: row.plant_name,
    line_number: row.line_number,

    // camelCase aliases — what the cards actually read
    companyname: row.company_name,
    plantname: row.plant_name,
    linenumber: row.line_number,

    // Times — frontend tolerates either casing, keep both
    timestamp: row.timestamp,
    created_at: row.last_updated || row.timestamp,
    start_time: row.start_time,
    Start_time: row.start_time,
    stop_time: row.stop_time,
    Stop_time: row.stop_time,

    // Status — both casings, again for frontend tolerance
    status: row.status,
    Status: row.status,

    // Top-level lever/force values (cards read these directly, not via parameters)
    latch_force: row.latch_force,
    claw_force: row.claw_force,
    safety_lever: row.safety_lever,
    claw_lever: row.claw_lever,
    stroke: row.stroke,
    alarm: row.alarm,

    production_count: row.production_count,
    model: row.model,
    product,
    parameters,
    Barcode_details,

    last_updated: row.last_updated,
  }
}

/**
 * Get all PLC dashboard data
 *
 * Optimizations:
 * - pagination
 * - raw query
 * - lightweight attributes
 * - proper filtering
 * - limit protection
 * - index-friendly sorting
 */
export const getAllPlcDashboardService = async (filters = {}, options = {}) => {
  try {
    const where = {}
    const page = Math.max(Number(options.page) || 1, 1)
    const limit = Math.min(Number(options.limit) || 6, 100)
    const offset = (page - 1) * limit

    /**
     * Exact filters
     */
    if (filters.device_id) {
      where.device_id = filters.device_id
    }

    if (filters.company_name) {
      where.company_name = filters.company_name
    }

    if (filters.plant_name) {
      where.plant_name = filters.plant_name
    }

    /**
     * Status filter
     */
    if (filters.status && filters.status !== 'All') {
      where.status = filters.status
    }

    /**
     * Main query
     */
    const [rows, totalItems] = await Promise.all([
      PlcDashboardModel.findAll({
        where,
        attributes: DASHBOARD_ATTRIBUTES,
        order: [['timestamp', 'DESC']],
        limit,
        offset,
        raw: true,
        subQuery: false,
      }),
      PlcDashboardModel.count({ where }),
    ])

    return {
      rows: rows.map(mapDashboardRow),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    }
  } catch (error) {
    console.error('Error fetching PLC dashboard:', error)

    throw new Error('Failed to fetch PLC dashboard data')
  }
}

/**
 * Get single dashboard by device id
 */
export const getPlcDashboardByDeviceService = async (deviceId) => {
  try {
    if (!deviceId) {
      throw new Error('deviceId is required')
    }

    const row = await PlcDashboardModel.findOne({
      where: { device_id: deviceId },
      attributes: DASHBOARD_ATTRIBUTES,
      raw: true,
    })

    return row ? mapDashboardRow(row) : null
  } catch (error) {
    console.error('Error fetching dashboard by device:', error)

    throw new Error('Failed to fetch device dashboard')
  }
}

/**
 * Get running machines only
 */
export const getRunningMachinesService = async () => {
  try {
    const rows = await PlcDashboardModel.findAll({
      where: { status: 'RUNNING' },
      attributes: DASHBOARD_ATTRIBUTES,
      order: [['timestamp', 'DESC']],
      limit: 500,
      raw: true,
    })
    return rows.map(mapDashboardRow)
  } catch (error) {
    console.error('Error fetching running machines:', error)

    throw new Error('Failed to fetch running machines')
  }
}

/**
 * Get dashboard statistics
 */
export const getDashboardStatsService = async () => {
  try {
    const [totalMachines, runningMachines, stoppedMachines] = await Promise.all([
      PlcDashboardModel.count(),
      PlcDashboardModel.count({ where: { status: 'RUNNING' } }),
      PlcDashboardModel.count({ where: { status: 'STOPPED' } }),
    ])

    return {
      totalMachines,
      runningMachines,
      stoppedMachines,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)

    throw new Error('Failed to fetch dashboard statistics')
  }
}

/**
 * Get distinct filter options
 */
export const getPlcDashboardOptionsService = async () => {
  try {
    const [companies, plants, models, statuses] = await Promise.all([
      PlcDashboardModel.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('company_name')), 'company_name']],
        where: { company_name: { [Op.ne]: null } },
        raw: true,
      }),

      PlcDashboardModel.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('plant_name')), 'plant_name']],
        where: { plant_name: { [Op.ne]: null } },
        raw: true,
      }),

      PlcDashboardModel.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('model')), 'model']],
        where: { model: { [Op.ne]: null } },
        raw: true,
      }),

      PlcDashboardModel.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('status')), 'status']],
        where: { status: { [Op.ne]: null } },
        raw: true,
      }),
    ])

    return {
      companies: companies.map((c) => c.company_name).filter(Boolean),
      plants: plants.map((p) => p.plant_name).filter(Boolean),
      models: models.map((m) => m.model).filter(Boolean),
      statuses: statuses.map((s) => s.status).filter(Boolean),
    }
  } catch (error) {
    console.error('Error fetching dashboard options:', error)

    throw new Error('Failed to fetch dashboard options')
  }
}

/**
 * Get latest updated machines
 */
export const getLatestUpdatedMachinesService = async (limit = 50) => {
  try {
    const rows = await PlcDashboardModel.findAll({
      attributes: DASHBOARD_ATTRIBUTES,
      order: [['last_updated', 'DESC']],
      limit,
      raw: true,
    })
    return rows.map(mapDashboardRow)
  } catch (error) {
    console.error('Error fetching latest machines:', error)

    throw new Error('Failed to fetch latest machines')
  }
}

/**
 * Heavy query with JSON included via the model scope (kept for legacy use).
 */
export const getDashboardWithExtraDataService = async (deviceId) => {
  try {
    const row = await PlcDashboardModel.scope('withExtraData').findOne({
      where: { device_id: deviceId },
      raw: true,
    })
    return row ? mapDashboardRow(row) : null
  } catch (error) {
    console.error('Error fetching dashboard extra data:', error)

    throw new Error('Failed to fetch extra dashboard data')
  }
}