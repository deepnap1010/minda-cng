// ─────────────────────────────────────────────────────────────────────────────
// Bundled sample data for the Cylinder module. Mirrors the response shapes the
// hooks expect, so every screen renders before the real backend is connected.
// When VITE_CYLINDER_API_URL is set, the hooks call your API instead of this.
// ─────────────────────────────────────────────────────────────────────────────

export const STATIONS = [
  ["material_receipt", "Material Receipt Insp.", 1, true, "manual"],
  ["material_storage", "Material Storage", 2, false, "manual"],
  ["pipe_cutting", "Pipe Cutting", 3, false, "manual"],
  ["bottom_spinning", "Bottom Spinning", 4, false, "auto"],
  ["bottom_milling", "Bottom Milling", 5, false, "auto"],
  ["serial_marking", "Cyl. Sr. No. Marking", 6, false, "auto"],
  ["neck_spinning", "Neck Spinning", 7, false, "auto"],
  ["heat_treatment", "Heat Treatment", 8, false, "auto"],
  ["hardness_testing", "Hardness Testing", 9, true, "auto"],
  ["neck_cutting", "Neck Cutting", 10, false, "auto"],
  ["neck_machining", "Neck Machining", 11, false, "auto"],
  ["neck_threading", "Neck Threading", 12, false, "auto"],
  ["wc_hst", "W/C & HST", 13, true, "auto"],
  ["inside_cleaning", "Inside Cleaning", 14, false, "manual"],
  ["air_leak_testing", "Air Leak Testing", 15, true, "auto"],
  ["air_drier", "Air Drier", 16, false, "auto"],
  ["internal_shot_blasting", "Internal Shot Blasting", 17, false, "auto"],
  ["external_shot_blasting", "External Shot Blasting", 18, false, "auto"],
  ["ultrasonic_testing", "Ultrasonic Testing", 19, true, "auto"],
  ["data_stamping", "Data Stamping", 20, false, "auto"],
  ["painting", "Painting", 21, false, "auto"],
  ["paut_bottom", "PAUT — Cyl. Bottom", 22, true, "auto"],
  ["storage_pallet", "Storage on Pallet", 23, false, "manual"],
].map(([key, name, index, isGate, captureType]) => ({ key, name, index, isGate, captureType }));

const stByIndex = new Map(STATIONS.map((s) => [s.index, s]));

export const SPECS = {
  hardness: [85, 95], proofPressure: [300, 310], ihfTemp: [600, 1400], spinningTemp: [600, 1200],
  neckTemp: [600, 1200], furnaceTemp: [820, 900], volumetricExp: [0, 0.5], leakRate: [0, 2],
  wallThk: [6.3, 6.8], bottomThk: [6.8, 7.3], diameter: [315, 320], taper: [0, 3],
};

export const MACHINES = [
  { key: "PC-2", name: "Pipe Cutting 2", stationIndex: 3, stationKey: "pipe_cutting", status: "run", primaryTag: "diameter", lastCylinderId: "Pipecutting1-60-V48002", countToday: 148, gaugeTags: [{ tag: "diameter", label: "Diameter", min: 310, max: 320, unit: "mm" }, { tag: "taper", label: "Taper", min: 0, max: 3, unit: "mm" }], initial: { diameter: 317.11, taper: 1.35 } },
  { key: "IHF-2", name: "IHF & Bottom Spinning", stationIndex: 4, stationKey: "bottom_spinning", status: "run", primaryTag: "ihfTemp", lastCylinderId: "Pipecutting1-60-V48002", countToday: 152, gaugeTags: [{ tag: "ihfTemp", label: "IHF Temp", min: 600, max: 1400, unit: "°C" }, { tag: "spinningTemp", label: "Spinning Temp", min: 600, max: 1200, unit: "°C" }, { tag: "daGas", label: "DA Gas", min: 0.4, max: 2, unit: "kg/cm²" }, { tag: "air", label: "Air", min: 0, max: 10, unit: "kg/cm²" }, { tag: "o2", label: "O₂", min: 0, max: 10, unit: "kg/cm²" }, { tag: "png", label: "PNG", min: 0.4, max: 2, unit: "kg/cm²" }], initial: { ihfTemp: 1145.29, spinningTemp: 989.91, daGas: 1.51, air: 5.25, o2: 4.0, png: 1.2 } },
  { key: "NS-2", name: "Neck Spinning", stationIndex: 7, stationKey: "neck_spinning", status: "run", primaryTag: "neckTemp", lastCylinderId: "Pipecutting1-60-V48004", countToday: 139, gaugeTags: [{ tag: "neckTemp", label: "Neck Temp", min: 600, max: 1200, unit: "°C" }, { tag: "spindleRpm", label: "Spindle RPM", min: 0, max: 600, unit: "rpm" }], initial: { neckTemp: 1062.4, spindleRpm: 420 } },
  { key: "HT-2", name: "Heat Treatment Furnace", stationIndex: 8, stationKey: "heat_treatment", status: "run", primaryTag: "furnaceTemp", lastCylinderId: "Pipecutting1-60-V48003", countToday: 160, gaugeTags: [{ tag: "furnaceTemp", label: "Furnace Temp", min: 820, max: 920, unit: "°C" }, { tag: "zone2", label: "Zone 2", min: 820, max: 920, unit: "°C" }, { tag: "zone3", label: "Zone 3", min: 820, max: 920, unit: "°C" }], initial: { furnaceTemp: 865.7, zone2: 858, zone3: 871 } },
  { key: "HRD-2", name: "Hardness Testing", stationIndex: 9, stationKey: "hardness_testing", status: "error", primaryTag: "hardness", errorMsg: "Reading below spec — sensor / heat-treat drift", lastCylinderId: "Pipecutting1-60-V40997", countToday: 144, gaugeTags: [{ tag: "hardness", label: "Hardness", min: 60, max: 100, unit: "HRB" }], initial: { hardness: 84 } },
  { key: "HST-2", name: "W/C & HST Station", stationIndex: 13, stationKey: "wc_hst", status: "run", primaryTag: "proofPressure", lastCylinderId: "Pipecutting1-60-V48001", countToday: 151, gaugeTags: [{ tag: "proofPressure", label: "Proof Pressure", min: 280, max: 320, unit: "bar" }, { tag: "volumetricExp", label: "Volumetric Exp.", min: 0, max: 1, unit: "%" }], initial: { proofPressure: 301.4, volumetricExp: 0.42 } },
  { key: "UT-2", name: "Ultrasonic Testing", stationIndex: 19, stationKey: "ultrasonic_testing", status: "run", primaryTag: "wallThk", lastCylinderId: "Pipecutting1-60-V48000", countToday: 150, gaugeTags: [{ tag: "wallThk", label: "Wall Thickness", min: 6, max: 7, unit: "mm" }], initial: { wallThk: 6.51 } },
  { key: "PT-2", name: "PAUT — Cyl. Bottom", stationIndex: 22, stationKey: "paut_bottom", status: "idle", primaryTag: "bottomThk", lastCylinderId: "Pipecutting1-60-V47998", countToday: 147, gaugeTags: [{ tag: "bottomThk", label: "Bottom Thickness", min: 6.5, max: 7.5, unit: "mm" }], initial: { bottomThk: 7.05 } },
];
const mByStation = new Map(MACHINES.map((m) => [m.stationKey, m]));

const BATCH = "7-09335";
const CYL_SEEDS = [
  { short: "V48002", kind: "live", at: 9 }, { short: "V48003", kind: "live", at: 8 },
  { short: "V48004", kind: "live", at: 7 }, { short: "V48005", kind: "live", at: 4 },
  { short: "V48006", kind: "live", at: 13 }, { short: "V48007", kind: "live", at: 19 },
  { short: "V47998", kind: "live", at: 22 },
  { short: "V48001", kind: "accepted" }, { short: "V48000", kind: "accepted" },
  { short: "V40999", kind: "accepted" }, { short: "V40998", kind: "accepted" },
  { short: "V40997", kind: "reject", at: 9, fail: { hardness: 78, result: "FAIL" } },
  { short: "V40988", kind: "reject", at: 9, fail: { hardness: 81, result: "FAIL" } },
  { short: "V40975", kind: "reject", at: 9, fail: { hardness: 79, result: "FAIL" } },
  { short: "V40970", kind: "reject", at: 9, fail: { hardness: 80, result: "FAIL" } },
  { short: "V40965", kind: "reject", at: 9, fail: { hardness: 82, result: "FAIL" } },
  { short: "V40996", kind: "reject", at: 13, fail: { proofPressure: 288, volumetricExp: 0.58, hold: 30, result: "FAIL" } },
  { short: "V40981", kind: "reject", at: 19, fail: { wallThk: 6.18, result: "FAIL" } },
];
const fullId = (s) => `Pipecutting1-60-${s}`;
const HOUR = 3600000;
const baseNow = Date.UTC(2026, 5, 27, 7, 0, 0); // stable timestamps so renders are deterministic

function stationData(i, short) {
  switch (i) {
    case 3: return { lengthA: 1102, lengthB: 1102, lengthC: 1101, thkA: 7.6, thkB: 7.4, thkC: 7.2, taper: 1.35, diameter: 317.11 };
    case 4: return { ihfTemp: 1145.29, spinningTemp: 989.91, daGas: 1.51, air: 5.25, o2: 4.0, png: 1.2 };
    case 7: return { neckTemp: 1062.4, spindleRpm: 420 };
    case 8: return { furnaceTemp: 865.7, soak: 48, quench: "OK" };
    case 9: return { hardness: 92, result: "PASS" };
    case 13: return { proofPressure: 301.4, volumetricExp: 0.42, hold: 30, result: "PASS" };
    case 15: return { leakRate: 0.8, result: "PASS" };
    case 19: return { wallThk: 6.51, result: "PASS" };
    case 20: return { serial: short, batch: BATCH, wpTp: "200/300" };
    case 22: return { bottomThk: 7.05, result: "PASS" };
    default: return null;
  }
}

const CYLS = new Map();
let rid = 1;
for (const c of CYL_SEEDS) {
  const id = fullId(c.short);
  const isAccepted = c.kind === "accepted";
  const isReject = c.kind === "reject";
  const current = isAccepted ? 23 : c.at;
  const status = isAccepted ? "accepted" : isReject ? "rejected" : "in_process";
  const startedAt = new Date(baseNow);
  const station = stByIndex.get(current);
  const cylinder = {
    id, shortSerial: c.short, model: "60", line: "Line 2", machine: "PC-2", heatNo: BATCH, batchId: BATCH,
    materialSize: "Ø317 × 7.5 mm", verifyToken: `tok-${c.short}`, currentStation: station.key,
    currentStageIndex: current, status, startedAt: startedAt.toISOString(),
    clearedAt: isAccepted ? new Date(baseNow + 6 * HOUR).toISOString() : null,
  };
  const records = [];
  const passUntil = c.kind === "live" ? current - 1 : isReject ? c.at - 1 : 23;
  for (let i = 1; i <= passUntil; i++) {
    const st = stByIndex.get(i);
    records.push({ id: rid++, cylinderId: id, stationKey: st.key, stationName: st.name, stageIndex: i, data: stationData(i, c.short), result: "pass", operatorId: st.captureType === "manual" ? "OP-101" : null, shift: "A", remarks: null, ts: new Date(baseNow + i * 12 * 60000).toISOString() });
  }
  if (isReject) {
    const st = stByIndex.get(c.at);
    records.push({ id: rid++, cylinderId: id, stationKey: st.key, stationName: st.name, stageIndex: c.at, data: c.fail, result: "fail", operatorId: null, shift: "A", remarks: null, ts: new Date(baseNow + c.at * 12 * 60000).toISOString() });
  }
  CYLS.set(id, { cylinder, records });
}
const ALL = [...CYLS.values()];

export function machineDTO(m) {
  const num = (t) => {
    if (typeof m.initial[t] === "number") return m.initial[t];
    const g = m.gaugeTags.find((x) => x.tag === t);
    return g ? (g.min + g.max) / 2 : null;
  };
  const pg = m.gaugeTags.find((g) => g.tag === m.primaryTag);
  return {
    key: m.key, name: m.name, line: "Line 2", stationIndex: m.stationIndex, stationKey: m.stationKey,
    primaryTag: m.primaryTag, gaugeTags: m.gaugeTags, status: m.status, errorMsg: m.errorMsg || null,
    lastCylinderId: m.lastCylinderId || null, countToday: m.countToday, live: { ...m.initial },
    primaryValue: num(m.primaryTag), primaryUnit: pg ? pg.unit : "",
    secondary: m.gaugeTags.filter((g) => g.tag !== m.primaryTag).slice(0, 2).map((g) => ({ label: g.label, tag: g.tag, value: num(g.tag), unit: g.unit })),
  };
}

// ── mock "endpoints" ─────────────────────────────────────────────────────────
export const mock = {
  machines: () => MACHINES.map(machineDTO),
  machine: (key) => {
    const m = MACHINES.find((x) => x.key === key);
    if (!m) return null;
    const recs = ALL.flatMap((c) => c.records).filter((x) => x.stationKey === m.stationKey).sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 8);
    const recent = recs.map((x) => { const c = CYLS.get(x.cylinderId); return { cylinderId: x.cylinderId, result: x.result, ts: x.ts, status: c ? c.cylinder.status : "in_process" }; });
    return { machine: machineDTO(m), live: { ...m.initial }, recent };
  },
  cylinders: (filters = {}) => {
    let rows = ALL.map((c) => c.cylinder);
    if (filters.status) rows = rows.filter((c) => c.status === filters.status);
    if (filters.q) { const s = String(filters.q).toLowerCase(); rows = rows.filter((c) => c.id.toLowerCase().includes(s) || c.heatNo.toLowerCase().includes(s) || c.model.toLowerCase().includes(s)); }
    const data = rows.map((c) => ({ ...c, done: c.status === "accepted" ? 23 : Math.max(0, c.currentStageIndex - 1) }));
    return { rows: data, total: data.length, page: 1, pageSize: 200 };
  },
  cylinder: (id) => {
    const found = CYLS.get(id);
    if (!found) return null;
    let defectMachine = null;
    if (found.cylinder.status === "rejected") {
      const f = found.records.find((x) => x.result === "fail");
      const m = f && mByStation.get(f.stationKey);
      if (m) defectMachine = { key: m.key, name: m.name };
    }
    return { cylinder: found.cylinder, records: found.records, stations: STATIONS, specs: SPECS, defectMachine };
  },
  defects: () => {
    const fails = ALL.flatMap((c) => c.records).filter((x) => x.result === "fail").sort((a, b) => b.ts.localeCompare(a.ts));
    const rows = fails.map((f) => {
      const m = mByStation.get(f.stationKey); const tag = m?.primaryTag; const g = m?.gaugeTags.find((x) => x.tag === tag);
      const val = tag && typeof f.data[tag] === "number" ? f.data[tag] : undefined; const band = tag ? SPECS[tag] : undefined;
      return { cylinderId: f.cylinderId, stationKey: f.stationKey, stationName: f.stationName, machineKey: m?.key ?? "—", machineName: m?.name ?? "—", captured: val != null ? `${val} ${g?.unit ?? ""}`.trim() : "—", spec: band ? `${band[0]}–${band[1]} ${g?.unit ?? ""}`.trim() : "—", batch: BATCH, ts: f.ts };
    });
    const sc = new Map(); rows.forEach((r) => sc.set(r.stationName, (sc.get(r.stationName) ?? 0) + 1));
    let topStage = "—", topStageCount = 0; for (const [s, n] of sc) if (n > topStageCount) { topStage = s; topStageCount = n; }
    const mc = new Map(); rows.forEach((r) => mc.set(r.machineKey, (mc.get(r.machineKey) ?? 0) + 1));
    let machineFlagged = "—", fn = 0; for (const [s, n] of mc) if (n > fn) { machineFlagged = s; fn = n; }
    return { kpis: { rejects: rows.length, topStage, topStageCount, machineFlagged, batch: BATCH }, rows };
  },
  ops: () => {
    const cleared = ALL.filter((c) => c.cylinder.status === "accepted").length;
    const inProc = ALL.filter((c) => c.cylinder.status === "in_process").length;
    const rej = ALL.filter((c) => c.cylinder.status === "rejected").length;
    const errorM = MACHINES.filter((m) => m.status === "error");
    const occ = ALL.filter((c) => c.cylinder.status === "in_process").map((c) => ({ index: c.cylinder.currentStageIndex, stationName: stByIndex.get(c.cylinder.currentStageIndex)?.name, cylinderShort: c.cylinder.shortSerial, cylinderId: c.cylinder.id, kind: "live" }));
    ALL.filter((c) => c.cylinder.status === "rejected").slice(0, 2).forEach((c) => occ.push({ index: c.cylinder.currentStageIndex, stationName: stByIndex.get(c.cylinder.currentStageIndex)?.name, cylinderShort: c.cylinder.shortSerial, cylinderId: c.cylinder.id, kind: "reject" }));
    occ.sort((a, b) => a.index - b.index);
    const feed = ALL.flatMap((c) => c.records).sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 8).map((x) => { const c = CYLS.get(x.cylinderId); return { cylinderShort: c ? c.cylinder.shortSerial : x.cylinderId, cylinderId: x.cylinderId, action: x.result === "fail" ? "rejected" : "cleared", stationName: x.stationName, result: x.result, ts: x.ts }; });
    return { kpis: { clearedToday: cleared, inProcess: inProc, rejectedToday: rej, machinesOnline: MACHINES.length - errorM.length, machinesTotal: MACHINES.length, errorMachine: errorM[0]?.name ?? null }, occupancy: occ, feed };
  },
};
