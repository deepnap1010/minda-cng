// Adapters: map the real CNG backend (/api/v1/cng/*) responses into the exact
// shapes the existing cylinder UI components already consume. This keeps the UI
// untouched while feeding it live data. The backend is 21-stage CNG; the mock UI
// was 23-stage JFE — these adapters reconcile that.

import { fieldMeta } from "./fields";

// The 21 CNG stages, in the {key,name,index,isGate,captureType} shape the UI uses.
export const CNG_STATIONS = [
  ["pipe_cutting", "Pipe Cutting", 1, false, "manual"],
  ["bottom_spinning", "Bottom Spinning", 2, false, "auto"],
  ["bottom_milling", "Bottom Milling", 3, false, "auto"],
  ["serial_marking", "Cyl. Sr. No. Marking", 4, false, "auto"],
  ["neck_spinning", "Neck Spinning", 5, false, "auto"],
  ["heat_treatment", "Heat Treatment", 6, false, "auto"],
  ["hardness_testing", "Hardness Testing", 7, true, "auto"],
  ["neck_cutting", "Neck Cutting", 8, false, "auto"],
  ["neck_machining", "Neck Machining", 9, false, "auto"],
  ["neck_threading", "Neck Threading", 10, false, "auto"],
  ["wc_hst", "W/C & HST", 11, true, "auto"],
  ["inside_cleaning", "Inside Cleaning", 12, false, "auto"],
  ["air_leak_testing", "Air Leak Testing", 13, true, "auto"],
  ["air_drier", "Air Drier", 14, false, "auto"],
  ["internal_shot_blasting", "Internal Shot Blasting", 15, false, "auto"],
  ["external_shot_blasting", "External Shot Blasting", 16, false, "auto"],
  ["ultrasonic_testing", "Ultrasonic Testing", 17, true, "auto"],
  ["data_stamping", "Data Stamping", 18, false, "auto"],
  ["painting", "Painting", 19, false, "auto"],
  ["paut_bottom", "PAUT — Cyl. Bottom", 20, true, "auto"],
  ["storage_pallet", "Storage on Pallet", 21, false, "auto"],
].map(([key, name, index, isGate, captureType]) => ({ key, name, index, isGate, captureType }));

const ST_BY_INDEX = new Map(CNG_STATIONS.map((s) => [s.index, s]));
export const stationByIndex = (i) => ST_BY_INDEX.get(Number(i)) || null;
export const stationKey = (i) => ST_BY_INDEX.get(Number(i))?.key || "";
export const stationName = (i) => ST_BY_INDEX.get(Number(i))?.name || (i ? `Stage ${i}` : "—");

// Spec/range bands per clean metric — used for gauge min/max and spec colouring.
// Tolerant: any metric not listed still renders (range derived from the value).
export const RANGES = {
  pressure: [0, 350], temperature: [0, 1000], hardness: [60, 100], depth: [0, 10],
  flow: [0, 50], thickness: [0, 12], speed: [0, 600], count: [0, 500],
  proofPressure: [280, 320], furnaceTemp: [820, 920], wallThk: [6, 7], bottomThk: [6.5, 7.5],
  // IHF & Bottom Spinning nominal bands (match the plant HMI); out-of-band demo
  // values auto-expand the max in gaugeTagsFrom so the needle never pegs.
  ihf_coil_temp: [0, 1400], ihf_temp: [0, 1400], spg_chuck_temp: [0, 1200], spinning_temp: [0, 1200],
  o2_pressure: [0, 10], png_pressure: [0, 10], air_pressure: [0, 10], da_gas: [0, 10],
};

const META = {
  pressure: { label: "Pressure", unit: "bar" }, temperature: { label: "Temperature", unit: "°C" },
  hardness: { label: "Hardness", unit: "HRB" }, depth: { label: "Depth", unit: "mm" },
  flow: { label: "Flow", unit: "LPM" }, thickness: { label: "Thickness", unit: "mm" },
  speed: { label: "Speed", unit: "rpm" }, count: { label: "Count", unit: "" },
};
export const metaFor = (key) => META[key] || fieldMeta(key);

export const shortOf = (pipeId) => (pipeId ? String(pipeId).split("-").pop() : "—");

export const mapCylStatus = (s) => (s === "completed" ? "accepted" : s === "scrapped" ? "rejected" : "in_process");
export const mapMachineStatus = (s) => (s === "running" ? "run" : s === "fault" ? "error" : "idle");

const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

// Build gauge tags from a clean metrics object (numeric fields only).
function gaugeTagsFrom(metrics = {}, headlineLabel) {
  const tags = [];
  for (const [k, v] of Object.entries(metrics)) {
    const n = num(v);
    if (n === null) continue; // skip strings like "FAULT"/"PASS"
    const meta = metaFor(k);
    let [mn, mx] = RANGES[k] || [0, Math.max(1, n * 1.6)];
    if (n > mx) mx = n * 1.2;            // never peg the needle when a value exceeds its nominal band
    if (n < mn) mn = Math.min(0, n);
    tags.push({ tag: k, label: meta.label || k, min: mn, max: mx, unit: meta.unit || "" });
    if (tags.length >= 6) break;
  }
  // Put the headline metric first if present.
  if (headlineLabel) {
    const i = tags.findIndex((t) => t.tag === headlineLabel);
    if (i > 0) tags.unshift(tags.splice(i, 1)[0]);
  }
  return tags;
}

// /machines item → machine card DTO. Handles both cylinder-telemetry machines
// (metrics from stage records) and machine-status feeds (explicit gauges/primary).
export function adaptMachineView(m) {
  const status = mapMachineStatus(m.status);
  let gaugeTags = [];
  let live = {};

  if (Array.isArray(m.gauges) && m.gauges.length) {
    // Machine-status feed — gauges carry their own min / max / unit.
    gaugeTags = m.gauges.map((g) => {
      const tag = g.tag || slugify(g.label);
      const v = num(g.value), mn = num(g.min), mx = num(g.max);
      return { tag, label: g.label || tag, min: typeof mn === "number" ? mn : 0, max: typeof mx === "number" ? mx : Math.max(1, (typeof v === "number" ? v : 1) * 1.6), unit: g.unit || "" };
    });
    m.gauges.forEach((g) => { const tag = g.tag || slugify(g.label); const v = num(g.value); if (v != null) live[tag] = v; });
  } else {
    // m.metrics may be an EMPTY object (truthy) when the machine row has no
    // latest_data yet — fall through to the latest stage record's metrics.
    const metrics = (m.metrics && Object.keys(m.metrics).length) ? m.metrics : (m.latest?.metrics || {});
    const headlineLabel = m.headline?.label || m.latest?.headline?.label || null;
    gaugeTags = gaugeTagsFrom(metrics, headlineLabel);
    live = { ...metrics };
  }

  let primaryTag = null, primaryValue = null, primaryUnit = "";
  if (m.primary?.label) {
    primaryTag = slugify(m.primary.label);
    primaryValue = num(m.primary.value);
    primaryUnit = m.primary.unit || "";
    const i = gaugeTags.findIndex((g) => g.tag === primaryTag);
    if (i > 0) gaugeTags.unshift(gaugeTags.splice(i, 1)[0]);
  } else {
    primaryTag = gaugeTags[0]?.tag || null;
    primaryValue = num(m.headline?.value) ?? (primaryTag != null ? num(live[primaryTag]) : null);
    primaryUnit = gaugeTags[0]?.unit || (primaryTag ? (metaFor(primaryTag).unit || "") : "");
  }

  return {
    key: m.machineId,
    name: m.name || m.machineId,
    line: m.line || "",
    stationIndex: m.stageNo ?? "—", stationKey: stationKey(m.stageNo),
    primaryTag, gaugeTags: gaugeTags.slice(0, 6), status,
    errorMsg: status === "error" ? "Out-of-spec / fault reported" : null,
    lastCylinderId: m.activePipeId || null,
    countToday: m.countToday ?? 0,
    live,
    primaryValue, primaryUnit,
    secondary: gaugeTags.filter((g) => g.tag !== primaryTag).slice(0, 2).map((g) => ({ label: g.label, tag: g.tag, value: num(live[g.tag]), unit: g.unit })),
  };
}

export const adaptMachines = (list = []) => list.map(adaptMachineView);

export function adaptMachineDetail(d) {
  if (!d) return null;
  const machine = adaptMachineView(d);
  // Prefer SQL-sourced recent cylinders (works without Mongo, honours date filter);
  // fall back to raw Mongo readings if that's all we have.
  const recent = (d.recent && d.recent.length
    ? d.recent.map((r) => ({
        cylinderId: r.pipeId || "—",
        result: r.result || (r.status === "fault" ? "fail" : "pass"),
        ts: r.ts,
        status: r.status === "fault" ? "rejected" : "in_process",
        stageNo: r.stageNo,
        stageName: r.stageName,
      }))
    : (d.readings || []).map((r) => ({
        cylinderId: r.pipeId || "—",
        result: (r.flags || []).some((f) => String(f).startsWith("fault")) ? "fail" : "pass",
        ts: r.serverTs,
        status: "in_process",
      }))
  ).slice(0, 100);
  return { machine, live: machine.live, recent, operatorUserId: d.operatorUserId || null };
}

export function adaptOps(dash, machinesRaw = [], inProc = []) {
  const k = dash?.kpis || {};
  const online = machinesRaw.filter((m) => ["running", "idle", "fault", "stopped"].includes(m.status)).length;
  const errorMachine = machinesRaw.find((m) => m.status === "fault")?.name || null;
  const occupancy = (inProc || [])
    .filter((c) => c.currentStageNo)
    .map((c) => ({ index: c.currentStageNo, stationName: stationName(c.currentStageNo), cylinderShort: shortOf(c.pipeId), cylinderId: c.pipeId, kind: "in_process" }))
    .sort((a, b) => a.index - b.index);
  const feed = (dash?.activity || []).map((a) => ({
    cylinderShort: shortOf(a.pipeId), cylinderId: a.pipeId,
    action: a.status === "fault" ? "rejected" : "cleared",
    stationName: a.stageName || stationName(a.stageNo), result: a.status === "fault" ? "fail" : "pass", ts: a.recordedAt,
  }));
  return {
    kpis: {
      clearedToday: k.completed ?? 0, inProcess: k.inProcess ?? 0, rejectedToday: k.openDefects ?? 0,
      machinesOnline: online, machinesTotal: k.machines ?? machinesRaw.length, errorMachine,
    },
    occupancy, feed,
  };
}

const doneFor = (status, stageNo) => (status === "completed" ? 21 : Math.max(0, (Number(stageNo) || 0) - (status === "in_process" ? 1 : 0)));

export function adaptCylinders(resp) {
  const rows = (resp?.data || []).map((c) => ({
    id: c.pipeId, shortSerial: shortOf(c.pipeId), model: c.currentMachineId || "—",
    heatNo: "—", batchId: "—", line: "",
    currentStation: stationKey(c.currentStageNo), currentStageIndex: c.currentStageNo || 0,
    status: mapCylStatus(c.status), startedAt: c.startedAt, clearedAt: c.completedAt,
    done: doneFor(c.status, c.currentStageNo),
  }));
  return { rows, total: resp?.total ?? rows.length, page: resp?.page ?? 1, pageSize: resp?.limit ?? rows.length };
}

// MSSQL returns JSON columns (metrics/deviations) as strings — parse defensively.
const asObj = (v) => {
  if (!v) return {};
  if (typeof v === "object") return v;
  try { return JSON.parse(v) || {}; } catch { return {}; }
};

export function adaptTrace(t) {
  if (!t) return null;
  const hasFault = (t.defects || []).length > 0 || (t.timeline || []).some((s) => s.status === "fault");
  const status = t.status === "completed" ? "accepted" : hasFault ? "rejected" : "in_process";
  const records = (t.timeline || [])
    .filter((s) => s.state === "done" || s.state === "fault" || s.recordedAt)
    .map((s) => ({
      stageIndex: s.stageNo, stationKey: stationKey(s.stageNo), stationName: s.name,
      data: asObj(s.metrics), result: s.status === "fault" ? "fail" : "pass", ts: s.recordedAt, machineId: s.machineId,
    }));
  const cylinder = {
    id: t.pipeId, shortSerial: shortOf(t.pipeId), model: "—", line: "", machine: "",
    heatNo: "—", batchId: "—", materialSize: "—", verifyToken: "",
    currentStation: stationKey(t.currentStageNo), currentStageIndex: t.currentStageNo || 1,
    status, startedAt: t.startedAt, clearedAt: t.completedAt,
  };
  const d0 = (t.defects || [])[0];
  const defectMachine = d0 ? { key: d0.machineId || "—", name: d0.machineId || "—" } : null;
  return { cylinder, records, stations: CNG_STATIONS, specs: RANGES, defectMachine };
}

export function adaptDefects(list = []) {
  const rows = list.map((d) => ({
    cylinderId: d.pipeId, stationKey: stationKey(d.stageNo), stationName: d.stageName || stationName(d.stageNo),
    machineKey: d.machineId || "—", machineName: d.machineId || "—",
    captured: d.value != null ? String(d.value) : d.field || "—",
    spec: "—", batch: "—", ts: d.detectedAt,
  }));
  const cnt = (sel) => {
    const m = new Map();
    rows.forEach((r) => m.set(sel(r), (m.get(sel(r)) || 0) + 1));
    let top = "—", n = 0;
    for (const [k, v] of m) if (v > n) { top = k; n = v; }
    return { top, n };
  };
  const st = cnt((r) => r.stationName);
  const mc = cnt((r) => r.machineKey);
  return { kpis: { rejects: rows.length, topStage: st.top, topStageCount: st.n, machineFlagged: mc.top, batch: "—" }, rows };
}
