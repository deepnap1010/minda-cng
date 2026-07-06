// Tolerant alias lists — the heart of "accept everything like EKC and JCI".
// EKC speaks snake_case (`machine_id`, `ts`, raw register dumps); JCI speaks
// camelCase (`machineId`, `timestamp`). The same alias resolver absorbs both
// without branching. These are intentionally broad and will be tightened once
// real CNG machine payloads are available.

// Where the machine identity may live in a payload (first match wins).
export const ID_KEYS = [
  "machineId", "machine_id", "machineCode", "machine_code",
  "deviceId", "device_id", "id", "machine", "tag", "node",
];

// Where the event timestamp may live.
export const TS_KEYS = [
  "timestamp", "ts", "time", "deviceTs", "device_ts", "datetime", "receivedAt", "received_at",
];

// Where the measurement bag may live. If none present, bare top-level keys
// (minus the id/ts/meta keys) are treated as the measurements.
export const DATA_KEYS = [
  "data", "payload", "metrics", "values", "tags", "readings", "registers", "params",
];

// Where the cylinder identity (Pipe ID) may live IF the PLC sends it inline.
// Primary linkage is scan-in (active cylinder per machine); this is the fallback.
export const PIPE_ID_KEYS = [
  "pipeId", "pipe_id", "pipeID", "cylinderId", "cylinder_id",
  "barcode", "barcodeId", "serial", "serialNo", "serial_no", "srNo", "sr_no",
];

// Optional machine name / type hints in the envelope.
export const NAME_KEYS = ["machineName", "machine_name", "name"];
export const TYPE_KEYS = ["machineType", "machine_type", "type"];

// Optional stage hint in the envelope. Primary stage source is cng_machine.stage_no
// (one machine per stage); a machine MAY also declare its stage in the packet.
export const STAGE_KEYS = ["stageNo", "stage_no", "stage"];

// Fault sentinels seen on real EKC PLC registers — render as FAULT, never as data.
export const FAULT_SENTINELS = new Set([-32768, 32767, 65535, -1]);

// Clean metric groups (first-match-wins). Display-ready, dialect-agnostic.
export const FIELD_ALIASES = {
  pressure: ["pressure", "fill_pressure", "fillPressure", "test_pressure", "proof_pressure", "bar", "psi"],
  temperature: ["temperature", "temp", "bath_temp", "bathTemp", "furnace_temp", "furnaceTemp"],
  flow: ["flow", "gas_flow", "gasFlow", "water_flow", "waterFlow", "waterLPH", "water"],
  speed: ["speed", "machine_speed", "machineSpeed", "rpm", "fabricSpeed"],
  depth: ["depth", "depth_of_cutting", "cutting_depth", "cuttingDepth"],
  hardness: ["hardness", "hrb", "hardness_hrb", "hardnessHRB"],
  thickness: ["thickness", "wall_thickness", "wallThickness", "wall"],
  count: ["count", "production_count", "productionCount", "counter", "production"],
};

// Setpoint vs actual pairs → deviation rows. Tolerant; refine with real data.
export const PARAM_PAIRS = [
  ["depth", "depth_actual"],
  ["servo_slow", "servo_slow_actual"],
  ["fast_servo", "fast_servo_actual"],
];

// Priority order for choosing the single "headline" metric on a card.
export const HEADLINE_PRIORITY = ["pressure", "temperature", "hardness", "depth", "flow", "thickness", "speed", "count"];
