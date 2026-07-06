// CNG telemetry simulator — posts EKC + JCI dialect packets for 4 machines to the
// live ingest endpoint, exactly like real PLCs would. Demonstrates "accept
// everything" (two different payload shapes), Pipe-ID linkage (inline here; real
// machines use scan-in), and defect detection (occasional fault sentinel).
//
// Usage:  node scripts/cng-simulate.js
// Env:    CNG_BASE (default http://localhost:9021/api/v1/cng), CNG_INGEST_KEY (optional)

import axios from "axios";

const BASE = process.env.CNG_BASE || "http://localhost:9021/api/v1/cng";
const KEY = process.env.CNG_INGEST_KEY || "";
const headers = KEY ? { "x-api-key": KEY } : {};
const TICK_MS = Number(process.env.CNG_TICK_MS || 2000);

const rnd = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100;
const FAULT = -32768;
const maybeFault = (v) => (Math.random() < 0.08 ? FAULT : v);

// 4 machines across the line — 2 EKC (snake_case, `ts`), 2 JCI (camelCase, `timestamp`).
const machines = [
  {
    dialect: "EKC", id: "ekc_bottom_milling_01", stage: 3, pipe: "PIPE-EKC-1001",
    build: () => ({ depth_of_cutting: rnd(4, 6), depth_actual: rnd(4, 6), servo_slow: rnd(10, 20), fast_servo: rnd(30, 40), dm130: rnd(100, 200) }),
  },
  {
    dialect: "EKC", id: "ekc_heat_treatment_01", stage: 6, pipe: "PIPE-EKC-1002",
    build: () => ({ furnace_temp: maybeFault(rnd(880, 920)), pressure: rnd(20, 30), hardness: rnd(85, 95) }),
  },
  {
    dialect: "JCI", id: "HARDNESS-01", stage: 7, pipe: "PIPE-JCI-2001",
    build: () => ({ hardness: maybeFault(rnd(85, 95)), speed: rnd(0, 5), status: "running" }),
  },
  {
    dialect: "JCI", id: "AIRLEAK-01", stage: 13, pipe: "PIPE-JCI-2002",
    build: () => ({ pressure: rnd(280, 310), flow: rnd(10, 15), leak: rnd(0, 1) }),
  },
];

function packet(m) {
  const data = m.build();
  if (m.dialect === "EKC") {
    return { machine_id: m.id, machineName: m.id, ts: Date.now() * 1000, pipe_id: m.pipe, stage_no: m.stage, source: "simulator", data };
  }
  return { machineId: m.id, machineName: m.id, timestamp: new Date().toISOString(), pipeId: m.pipe, stageNo: m.stage, source: "simulator", data };
}

async function tick() {
  for (const m of machines) {
    try {
      const res = await axios.post(`${BASE}/ingest`, packet(m), { headers, timeout: 8000 });
      const d = res.data?.data || {};
      console.log(`✓ ${m.id} → pipe=${d.pipeId || "-"} stage=${d.stageNo ?? "-"} status=${d.status} flags=${(d.flags || []).join(",") || "-"}`);
    } catch (e) {
      console.error(`✗ ${m.id}:`, e.response?.status || "", e.response?.data?.error || e.message);
    }
  }
}

console.log(`CNG simulator → ${BASE}/ingest every ${TICK_MS}ms (key ${KEY ? "set" : "none"})`);
tick();
setInterval(tick, TICK_MS);
