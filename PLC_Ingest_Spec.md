# CNG Cylinder — PLC / Machine Data Ingest Specification

**For the JP Minda PLC / automation engineer.** This is how a machine (or an edge gateway) sends live cylinder-process data into the CNG tracking system. The endpoint is deliberately tolerant — send snake_case or camelCase, one reading or a batch — but this document defines the recommended shape.

---

## 1. Endpoint

| | |
|---|---|
| **Production** | `POST https://digitisationapi.jpmgroup.co.in/api/v1/cng/ingest` |
| **Local test** | `POST http://localhost:9021/api/v1/cng/ingest` |
| **Content-Type** | `application/json` |
| **Auth header** | `x-api-key: <the key issued to you>` |
| **Response** | `202 Accepted` for any valid JSON — **the line never stalls**. A bad/missing key returns `401`. |

> The API key is issued by JP Minda IT (one per line/gateway, revocable). It is **not** the SAP sync key — it is a dedicated CNG ingest key.

---

## 2. Message shape (one machine reading per message)

```json
{
  "machineId":  "HT-401",                    // REQUIRED — which machine reported
  "machineName":"Heat Treatment 1",          // optional — friendly name
  "stageNo":    6,                            // 1–21, the process stage this machine feeds
  "pipeId":     "JPM24C08921",                // the cylinder being processed (see §4)
  "timestamp":  "2026-07-04T09:41:22Z",       // ISO-8601; if omitted, arrival time is used
  "data": {                                   // the actual readings + verdict
    "furnace_temp": 892,
    "soak_min":     42,
    "result":       "OK",                     // "OK" | "NG"  → pass/fail for this stage
    "status":       "run"                     // run | idle | stopped | fault
  }
}
```

**Batches:** you may also POST a **JSON array** of such objects in one request.

---

## 3. Field guide (all aliases accepted — first match wins)

| Field | Required | Accepted keys | Notes |
|---|---|---|---|
| **Machine ID** | ✅ | `machineId`, `machine_id`, `deviceId`, `tag`, `machine` | uniquely identifies the machine/station |
| **Pipe ID** | ✅ for stages 2–21 | `pipeId`, `pipe_id`, `barcode`, `serial`, `srNo`, `cylinderId` | the cylinder this reading belongs to (see §4) |
| **Stage No** | recommended | `stageNo`, `stage_no`, `stage` | 1–21; if omitted, the machine's pre-mapped stage is used |
| **Timestamp** | optional | `timestamp`, `ts`, `time`, `deviceTs` | ISO-8601 preferred |
| **Readings** | ✅ | `data`, `readings`, `params`, `metrics`, `values` | an object of `{ name: value }`; OR put the readings as bare top-level keys |
| **Result** | recommended | `result` inside `data` | `"OK"` = pass, anything else = fail (raises a defect) |
| **Status** | optional | `status` inside `data` | `run`/`idle`/`stopped`/`fault` — drives the machine board |

Fault sentinel values `-32768, 32767, 65535, -1` are auto-detected and shown as **FAULT**, never as data.

---

## 4. How the cylinder is identified (important)

Every cylinder has a unique **Pipe ID**, created at **Stage 1 (Pipe Cutting)** by the operator. For a reading to attach to the right cylinder, the machine must tell us which Pipe ID it's working on, in **one** of two ways:

1. **Inline (preferred):** include `pipeId` in every message (as above). Simplest if the PLC/gateway knows the cylinder on the machine.
2. **Scan-in:** if the PLC can't send an ID, the operator scans the cylinder onto the machine first (a one-time `POST /api/v1/cng/scan`), and subsequent readings auto-attach to that machine's active cylinder.

Without a Pipe ID a reading is still accepted and stored, but it will show as machine-status only (not attached to a cylinder's trace).

---

## 5. Examples

**A normal stage reading (Heat Treatment, pass):**
```json
{ "machineId":"HT-401", "stageNo":6, "pipeId":"JPM24C08921",
  "data": { "furnace_temp":892, "soak_min":42, "result":"OK", "status":"run" } }
```

**A rejected reading (Air Leak Test, fail → raises a defect):**
```json
{ "machineId":"ALT-1301", "stageNo":13, "pipeId":"JPM24C08921",
  "data": { "leak_rate":0.34, "result":"NG", "status":"fault" } }
```

**curl test:**
```bash
curl -X POST https://digitisationapi.jpmgroup.co.in/api/v1/cng/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_KEY>" \
  -d '{"machineId":"HT-401","stageNo":6,"pipeId":"JPM24C08921","data":{"furnace_temp":892,"result":"OK","status":"run"}}'
```

---

## 6. Checklist for the PLC engineer

- [ ] Confirm the **field names** your PLC actually emits (send us one real sample payload).
- [ ] Confirm the **machine → stageNo** mapping for each station (1–21).
- [ ] Confirm how the **Pipe ID** reaches each machine (inline vs scan-in).
- [ ] Confirm the **result** flag values used for pass/fail.
- [ ] We issue you the **`x-api-key`**; you POST to the endpoint above.

*Deepnap Softech — CNG Cylinder Process Tracking for JP Minda Group.*
