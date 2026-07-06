// CNG business tables (SQL Server / JPMDO). All NEW + additive — no foreign keys
// into MINDA tables. Identity is `pipe_id`. Telemetry RAW lives in Mongo
// (cngReading.mongo.js); these tables hold the normalized, queryable state the
// dashboards read. Convention mirrors plcData.model.js: UUID `_id` via NEWID(),
// snake_case columns/tables, timestamps as created_at/updated_at.

import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

const pk = () => ({
  type: DataTypes.UUID,
  defaultValue: Sequelize.literal("NEWID()"),
  primaryKey: true,
});

// One row per physical cylinder. Born at stage 1 (manual). pipe_id = identity.
export const CngCylinderModel = sequelize.define(
  "CngCylinder",
  {
    _id: pk(),
    pipe_id: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "in_process" }, // in_process | completed | scrapped
    current_stage_no: { type: DataTypes.INTEGER, allowNull: true },
    current_machine_id: { type: DataTypes.STRING(120), allowNull: true },
    latest_data: { type: DataTypes.JSON, allowNull: true }, // denormalized latest clean metrics (fast card reads)
    started_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at", tableName: "cng_cylinder" }
);

// One row per machine on the CNG line. One machine feeds one stage (stage_no).
export const CngMachineModel = sequelize.define(
  "CngMachine",
  {
    _id: pk(),
    machine_id: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(160), allowNull: true },
    machine_type: { type: DataTypes.STRING(120), allowNull: true },
    dialect: { type: DataTypes.STRING(20), allowNull: true }, // EKC | JCI | null
    stage_no: { type: DataTypes.INTEGER, allowNull: true }, // 2..21 (which stage this machine feeds)
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "unknown" }, // running|idle|stopped|fault|disconnected|unknown
    active_pipe_id: { type: DataTypes.STRING(120), allowNull: true }, // current cylinder (scan-in)
    operator_user_id: { type: DataTypes.STRING(120), allowNull: true }, // assigned operator (users._id) — for stage-handoff notifications
    metrics_seen: { type: DataTypes.JSON, allowNull: true }, // accumulated field keys ever seen
    thresholds: { type: DataTypes.JSON, allowNull: true }, // {pressureMax:..} for breach highlight
    line: { type: DataTypes.STRING(80), allowNull: true }, // e.g. "L1 / St 1"
    latest_data: { type: DataTypes.JSON, allowNull: true }, // current reading values {label: value}
    gauges: { type: DataTypes.JSON, allowNull: true }, // [{tag,label,value,min,max,unit}] for machine-status feeds
    primary_label: { type: DataTypes.STRING(120), allowNull: true },
    primary_value: { type: DataTypes.FLOAT, allowNull: true },
    primary_unit: { type: DataTypes.STRING(40), allowNull: true },
    last_seen_at: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at", tableName: "cng_machine" }
);

// Normalized per-(Pipe ID x stage) event. This is what cards/dashboards read.
export const CngStageRecordModel = sequelize.define(
  "CngStageRecord",
  {
    _id: pk(),
    pipe_id: { type: DataTypes.STRING(120), allowNull: false },
    stage_no: { type: DataTypes.INTEGER, allowNull: false },
    stage_name: { type: DataTypes.STRING(120), allowNull: true },
    machine_id: { type: DataTypes.STRING(120), allowNull: true }, // null for manual stage 1
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "ok" }, // ok | warn | fault | running | idle
    headline_label: { type: DataTypes.STRING(120), allowNull: true }, // chosen card headline metric
    headline_value: { type: DataTypes.FLOAT, allowNull: true },
    metrics: { type: DataTypes.JSON, allowNull: true }, // clean normalized key→value bag
    deviations: { type: DataTypes.JSON, allowNull: true }, // setpoint/actual/delta rows
    flags: { type: DataTypes.JSON, allowNull: true },
    reading_id: { type: DataTypes.STRING(60), allowNull: true }, // Mongo _id of the raw reading (audit link)
    source: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "ingest" }, // ingest | manual | simulator
    entered_by: { type: DataTypes.STRING(120), allowNull: true }, // operator id for manual stage
    recorded_at: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at", tableName: "cng_stage_record" }
);

// Scan-in bridge: which cylinder is/was on which machine, over time. Resolves
// the Pipe ID for incoming telemetry. `active` = currently mounted.
export const CngProductionRunModel = sequelize.define(
  "CngProductionRun",
  {
    _id: pk(),
    pipe_id: { type: DataTypes.STRING(120), allowNull: false },
    machine_id: { type: DataTypes.STRING(120), allowNull: false },
    stage_no: { type: DataTypes.INTEGER, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    ended_at: { type: DataTypes.DATE, allowNull: true },
    started_by: { type: DataTypes.STRING(120), allowNull: true },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at", tableName: "cng_production_run" }
);

// Rejections / out-of-spec / fault events, tied to a Pipe ID.
export const CngDefectModel = sequelize.define(
  "CngDefect",
  {
    _id: pk(),
    pipe_id: { type: DataTypes.STRING(120), allowNull: false },
    stage_no: { type: DataTypes.INTEGER, allowNull: true },
    machine_id: { type: DataTypes.STRING(120), allowNull: true },
    type: { type: DataTypes.STRING(40), allowNull: true }, // fault_sentinel | out_of_range | junk_value | manual
    field: { type: DataTypes.STRING(120), allowNull: true },
    value: { type: DataTypes.FLOAT, allowNull: true },
    message: { type: DataTypes.STRING(400), allowNull: true },
    resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    detected_at: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at", tableName: "cng_defect" }
);

// x-api-keys for the ingest endpoint. Stored HASHED (never plaintext). No expiry.
export const CngIngestKeyModel = sequelize.define(
  "CngIngestKey",
  {
    _id: pk(),
    key_hash: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(120), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    last_used_at: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at", tableName: "cng_ingest_key" }
);

export const CngModels = {
  CngCylinderModel,
  CngMachineModel,
  CngStageRecordModel,
  CngProductionRunModel,
  CngDefectModel,
  CngIngestKeyModel,
};
