// Total number of CNG manufacturing stages (was 23 in the old JFE model).
export const TOTAL_STAGES = 21;

// Labels + units for the schema-agnostic stage-data keys. Spec bands arrive per
// cylinder in the trace payload. Unknown keys fall back to the raw key name.
export const FIELD_META = {
  lengthA: { label: "Length A", unit: "mm" }, lengthB: { label: "Length B", unit: "mm" }, lengthC: { label: "Length C", unit: "mm" },
  thkA: { label: "Thk A", unit: "mm" }, thkB: { label: "Thk B", unit: "mm" }, thkC: { label: "Thk C", unit: "mm" },
  taper: { label: "Taper", unit: "mm" }, diameter: { label: "Diameter", unit: "mm" },
  ihfTemp: { label: "IHF Temp", unit: "°C" }, spinningTemp: { label: "Spinning Temp", unit: "°C" },
  daGas: { label: "DA Gas", unit: "kg/cm²" }, air: { label: "Air", unit: "kg/cm²" }, o2: { label: "O₂", unit: "kg/cm²" }, png: { label: "PNG", unit: "kg/cm²" },
  neckTemp: { label: "Neck Temp", unit: "°C" }, spindleRpm: { label: "Spindle RPM", unit: "rpm" },
  furnaceTemp: { label: "Furnace Temp", unit: "°C" }, zone2: { label: "Zone 2", unit: "°C" }, zone3: { label: "Zone 3", unit: "°C" },
  soak: { label: "Soak Time", unit: "min" }, quench: { label: "Quench" },
  hardness: { label: "Hardness", unit: "HRB" },
  proofPressure: { label: "Proof Pressure", unit: "bar" }, volumetricExp: { label: "Volumetric Exp.", unit: "%" }, hold: { label: "Hold", unit: "s" },
  leakRate: { label: "Leak Rate", unit: "cc/min" },
  wallThk: { label: "Wall Thk (UT)", unit: "mm" }, bottomThk: { label: "Bottom Thk (PAUT)", unit: "mm" },
  serial: { label: "Serial" }, batch: { label: "Batch" }, wpTp: { label: "WP/TP", unit: "bar" },
  result: { label: "Result" },
  // Stage 1 (Pipe Cutting) operator-entry keys
  heatNo: { label: "Heat No" }, batchNo: { label: "Batch No" }, grade: { label: "Grade" },
  od: { label: "Pipe OD", unit: "mm" }, wall: { label: "Wall Thk", unit: "mm" },
  cutLength: { label: "Cut Length", unit: "mm" }, cutWeight: { label: "Cut Weight", unit: "kg" },
  line: { label: "Line" }, shift: { label: "Shift" }, remark: { label: "Remark" },
};

export const fieldMeta = (key) => FIELD_META[key] ?? { label: key };

export const fmt = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 100) / 100);

export const clockTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const dateTime = (iso) => (iso ? new Date(iso).toLocaleString("en-GB") : "—");

export function timeAgo(iso) {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 45) return "now";
  const m = Math.round(secs / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

// pipeline state per station, ported from the cylinder trace logic
export function buildStages(cyl, stations, records) {
  const recByIndex = new Map();
  records.forEach((r) => recByIndex.set(r.stageIndex, r));
  const failRec = records.find((r) => r.result === "fail");
  const failIndex = failRec?.stageIndex ?? cyl.currentStageIndex;
  return stations.map((s) => {
    let state;
    if (cyl.status === "rejected") state = s.index < failIndex ? "done" : s.index === failIndex ? "fail" : "pend";
    else if (cyl.status === "accepted") state = "done";
    else state = s.index < cyl.currentStageIndex ? "done" : s.index === cyl.currentStageIndex ? "live" : "pend";
    return { station: s, state, record: recByIndex.get(s.index) ?? null };
  });
}

export function doneCount(cyl, records) {
  if (cyl.status === "accepted") return TOTAL_STAGES;
  if (cyl.status === "rejected") {
    const failRec = records.find((r) => r.result === "fail");
    return Math.max(0, (failRec?.stageIndex ?? cyl.currentStageIndex) - 1);
  }
  return Math.max(0, cyl.currentStageIndex - 1);
}
