# CNG Cylinder Process Tracking — Architecture Brief

**Module:** `CNG_PROCESS` inside the JP Minda platform · **Stack:** React 19 + Express + Prisma + MySQL · **Builder:** Deepnap Softech
**Anchored on the proven EKC/JCI ingest pattern. New `cng_*` tables only — MINDA tables untouched, no FKs into MINDA.**

---

## 1. How EKC and JCI work today — the proven pattern, end to end, and where the two dialects differ

Both EKC (Everest Kanto Cylinder, CNC line making CNG/high-pressure cylinders) and JCI (textile/dyeing machines) implement the **same end-to-end shape**, proven across ~100 machines in production:

1. **Device → POST.** A PLC/SCADA job POSTs one JSON request per machine every ~5–15s to `POST /api/v1/ingest` with an `x-api-key` header. Canonical envelope is `{ machineId | machine_id, machineName?, machineType?, timestamp | ts?, data:{...} }` where `data` is a **flat, free-form** dict of whatever the PLC has.
2. **Store raw verbatim.** The route validates only the envelope (id present, `data` is an object) and writes the body **untouched** into a schema-agnostic store. It **never rejects valid JSON** and **always responds 2xx** (202 Accepted).
3. **Auto-register the machine.** Unknown `machineId` upserts a `Machine` doc on first sight; every field key ever seen accumulates into `metricsSeen` via `$addToSet`. No migration to add a PLC field.
4. **Normalize at READ time.** The ingest path does **zero** transformation. A `derive.ts`/`derive.js` layer maps free-form `data` to a stable "machine view" via **alias lists** (first-match-wins), derives `status`/`efficiency`/`downtime`, and maps department.
5. **Push + poll.** Socket.io broadcasts a content-less nudge (`state:update` for JCI, `telemetry:new` for EKC); the client re-fetches the derived REST view, with an **8s poll** as a liveness fallback.
6. **Dynamic cards.** The dashboard renders one card per machine from **whatever fields arrived** — no hardcoded per-machine schema.

**Where the two dialects differ (this matters — CNG must accept both):**

| Aspect | **JCI** | **EKC** |
|---|---|---|
| ID key | `machineId` (camelCase) | `machine_id` (snake_case); also resolves `machineCode`, `deviceId`, `id`, `machine`, `tag` |
| Timestamp key | `timestamp` | `ts` (microsecond UTC), plus `receivedAt` |
| `data` envelope | always present, flat | `data`/`payload`/`metrics`/`values`/`tags`/`readings`/`registers`; **if absent, bare top-level keys are the measurements** |
| Field names | textile: `bathTemp`, `speed`, `counter`, `waterLPH` | CNC setpoint/actual pairs: `depth_of_cutting`/`depth_actual`, `servo_slow`/`servo_slow_actual`, `fast_servo`, `dm130` (=PLC register D130) |
| Machine id style | `MAXI-01`, `WASHER-01` | `ekc_bottom_milling_01` (type derived by stripping `ekc_` prefix + trailing `_NN`) |
| Two shapes | named feed (~6–24 keys) | **named feed (~6 keys) AND raw PLC memory dump (~3,504 keys: D/M/X/Y/T/C registers)** |
| Bad data | junk negatives (e.g. `CHEM3TOTALLTR: -563.3`) | fault sentinels (`-32768`, `32767`, `65535`) rendered as `FAULT` |
| Missing id | n/a | stored under sentinel `UNIDENTIFIED` with `flags:['missing_machineId']`, never dropped |

**The unifying trick:** EKC's `normalizePayload()` / fullstack `normalizeIngestPayload()` resolve id/ts/data each from an **alias list** (`ID_KEYS`, `TS_KEYS`, `DATA_KEYS`). The same tolerant normalizer absorbs **both** dialects without branching. CNG must reuse this exact approach — "accept everything the EKC/JCI ingest servers accept."

Key source files: `D:/ekc-api/ekc-smartfactory/server/src/lib/ingestService.js`, `D:/ekc-api/ekc-fullstack/server/src/services/ingest.service.ts`, `D:/ekc-api/ekc-smartfactory/shared/index.js` (FIELD_ALIASES/PARAM_PAIRS), `.../smartfactory/server/src/routes/ingest.ts` (JCI), `.../smartfactory/server/src/lib/derive.ts` (JCI).

---

## 2. The "accept everything" mechanism — and how to reproduce it in MySQL + Prisma

**How it works in Mongo today (the literal mechanism):**
- **JCI:** `TelemetryModel.data` is `Schema.Types.Mixed, required:true` → any shape stored verbatim. Plainly stated in the JCI PDF: *"You decide the field names. We accept any shape."*
- **EKC:** `Telemetry.data` is `Mixed` (extracted measurements) **and** `Telemetry.raw` is `Mixed` (the untouched original body). The `ekc-rhl` read-only mirror additionally sets Mongoose `strict:false`.
- It is **not** a `strict:false` toggle that does the heavy lifting — it's **`Mixed` columns + storing the whole body in `raw`** + upserting unknown ids + `$addToSet metricsSeen`.
- Unparseable JSON is never silently dropped: EKC writes raw bytes to a **Quarantine** dead-letter collection and returns 400; oversize (>10mb) → 413.

**Reproducing this in MySQL 8 + Prisma:**

MySQL has a native `JSON` column type, and Prisma maps it to the `Json` scalar. That **is** our `Mixed`. The recipe:

1. **One raw JSON column per telemetry row** holds the entire original payload verbatim: `rawPayload Json` (this is EKC's `raw`). A second `data Json` holds the extracted measurement bag (EKC's `data`). Adding a new PLC field requires **no migration** — it just lands inside the JSON blob.
2. **Validate only the envelope.** Resolve `machineId` from the alias list; require `data` to be an object (or treat bare top-level keys as data). Anything else still gets stored with `flags`.
3. **Always respond 2xx for valid JSON** — return `202 { ok:true }`. Only DB errors → 500.
4. **Dead-letter for unparseable JSON.** Keep an Express `express.json({ verify })` hook to retain `req.rawBody`; on JSON parse failure write to `cng_quarantine` (raw bytes as `LONGTEXT`/`String`) and return 400 — never drop.
5. **Auto-register the cylinder/machine + accumulate seen fields.** Upsert `cng_machine` on unknown id; merge new field keys into a `metricsSeen Json` array (emulating `$addToSet` with a read-merge-write or a small dedupe).
6. **Field discovery** = query `JSON_KEYS(rawPayload)` / `JSON_KEYS(data)` to power a `/discover` profiler, mirroring EKC's `$objectToArray` aggregation.

Prisma caveat to flag: `Json` columns are stored/queried as opaque blobs; deep filtering uses MySQL JSON path operators and is not richly typed. That's acceptable — dashboards read **normalized columns** (section 3/4), not the raw JSON.

---

## 3. CNG live-telemetry data flow

```
EKC PLC ( machine_id, ts, data{depth_of_cutting,...} )   JCI PLC ( machineId, timestamp, data{bathTemp,...} )
        \                                                /
         \------------------  x-api-key  --------------/
                              |
                  POST /api/cng/ingest   (Express, mounted BEFORE dashboard auth)
                              |
        (1) verify x-api-key against cng_ingest_key   --> 401 if no match (and keys configured)
        (2) parse; unparseable JSON --> cng_quarantine, 400
                              |
        (3) STORE RAW VERBATIM  -->  cng_machine_reading.rawPayload (Json)   <-- source of truth, never shown on cards
                              |
        (4) NORMALIZE (read-time-style, run once on ingest for write-back):
              - resolve machineId via ID_KEYS aliases
              - resolve Pipe ID via PIPE_ID_KEYS aliases (see Q in section 6)
              - map machine --> stage (1..21) via cng_machine.stageNo
              - resolve clean metrics via CNG FIELD_ALIASES (pressure/flow/temp/depth...)
              - coerce numbers, flag fault sentinels (-32768/32767/65535) and junk negatives
                              |
        (5) WRITE NORMALIZED  --> cng_stage_record (one row per Pipe ID x stage event: pipeId, stageNo, status, clean metrics)
                              --> upsert cng_cylinder (Pipe ID identity), upsert cng_machine (lastSeen, metricsSeen)
                              --> cng_defect rows if fault/out-of-range detected
                              |
        (6) Socket.io io.emit('cng:update', { pipeId, stageNo })   (content-less nudge)
                              |
                React 19 client: on 'cng:update' debounce-refetch REST  +  8s poll fallback
                Dashboards (Cng_dashboard / Live_processing / Machines_data / History) render NORMALIZED values
```

**Explicit raw-vs-normalized split:**
- **RAW lives in `cng_machine_reading.rawPayload` (JSON)** — the append-only, time-stamped, verbatim packet. This is EKC's `Telemetry.raw`. It is the audit/replay store and is **projected out of all list reads by default** (EKC pattern: `{ raw:0 }`, only via `?includeRaw=true`).
- **NORMALIZED lives in real typed columns** on `cng_stage_record` (and the denormalized "latest" snapshot on `cng_cylinder`/`cng_machine`). Cards/dashboards read **only** these.

**Why normalize at ingest (write-back) rather than purely at read-time:** EKC/JCI normalize at read-time because Mongo `Mixed` is cheap to re-derive. In MySQL we want indexed, queryable normalized columns and a clean Pipe-ID timeline, so CNG should run the same alias/derive logic **once at ingest** and persist the result into `cng_stage_record`, while still keeping the verbatim `rawPayload`. The derive logic itself is lifted from `derive.js`/`derive.ts` (alias lists, status derivation, deviation pairs).

**Auth split (proven EKC/JCI pattern):** ingest is guarded **only** by `x-api-key`; if no keys are configured it runs open ("discovery mode"). The ingest route is mounted **before** dashboard auth middleware because "machines are not dashboard users." Dashboard/read routes use the platform's normal JP Minda auth + RBAC.

---

## 4. "Show processed, not raw" — dynamic cards today, and the CNG mapping

**How EKC/JCI build dynamic cards today (all reusable):**
- **JCI** (`client/src/pages/Machines.tsx`): card consumes `MachineView.state` (the derived object), shows fixed headline metrics (Production, Speed, Temperature, Efficiency, Water Flow, Updated) resolved through alias lists, **plus** a Details modal that iterates `machine.metricsSeen` to surface every discovered IOT param by key. Raw `data` is carried only so the modal can show the long tail.
- **EKC** (`client/src/pages/Machines.jsx`): fully schema-agnostic — `Object.entries(data).slice(0, MAX_METRICS=12)` renders generic key/value rows, with `+N more fields (raw PLC dump)` overflow (critical because the raw dump has ~3,504 keys). Status pill from derived `status`; `● live` vs `last Xs ago` from a `fresh` flag; deviation rows (set/actual/delta) above the grid.
- **`ekc-rhl`** adds a 3-stage curation worth copying: (1) `flatten.ts` flattens nested PLC payloads to dotted scalar keys; (2) `normalize.ts` classifies named scalars vs digital I/O vs raw registers vs **fault sentinels** (`-32768/32767/65535`→`FAULT`); (3) `params.ts` ranks keys by a domain-importance regex list and `headline.ts` computes **one** derived KPI. `format.ts` humanizes keys (`prettyKey`), applies `breachesThreshold` against a `thresholds` map.

**Processed, never raw:** every source shows derived/formatted values (status, efficiency, deviations, formatted numbers, fault sentinels rendered as `FAULT`, thresholds highlighted red); the raw packet is excluded from list reads.

**The CNG mapping — raw EKC/JCI payload → Pipe ID + stage + display-ready metrics:**

| Step | Rule | From source |
|---|---|---|
| Resolve **machineId** | alias list `ID_KEYS` (`machine_id`,`machineId`,`machineCode`,`deviceId`,`id`,...) | EKC `ingestService.js` |
| Resolve **Pipe ID** | alias list `PIPE_ID_KEYS` (e.g. `pipeId`,`pipe_id`,`cylinderId`,`barcode`,`serial`) — **needs confirmation, see §6** | new, modeled on EKC ID resolution |
| Resolve **stage (1–21)** | look up `cng_machine.stageNo` for the resolved machine; stage 1 (Pipe Cutting) is **MANUAL** (UI form writes `cng_stage_record` directly, no PLC) | proposal deck + EKC machine-type derivation |
| Resolve **clean metrics** | CNG `FIELD_ALIASES` (first-match-wins): e.g. `pressure←['pressure','fill_pressure','bar']`, `flow←['flow','gas_flow','waterFlow','waterLPH']`, `temperature←['temperature','temp','bathTemp']`, `depth←['depth_of_cutting','depth','cutting_depth']` | EKC/JCI alias pattern |
| Setpoint vs actual | `PARAM_PAIRS` (e.g. `depth` vs `depth_actual`, `servoSlow` vs `servo_slow_actual`) → deviation + pct | EKC `derive.js` |
| Fault/bad data | sentinels `-32768/32767/65535`→`FAULT`; junk negatives flagged → `cng_defect` | `ekc-rhl normalize.ts`, JCI simulator |
| Card headline | one derived KPI per stage (e.g. fill pressure, cut depth vs target) | `ekc-rhl headline.ts` |
| Overflow | cap rendered fields (MAX 12) + "raw PLC dump" link to raw modal | EKC `Machines.jsx` |

So a **CNG cylinder card** is keyed by **Pipe ID**, shows its **current/last stage (1–21)**, a status pill, the stage's derived headline metric + a few clean metrics, deviation rows, and a live/stale badge — all from normalized columns. The 4 frontend modules: **Cng_dashboard** (fleet KPIs), **Live_processing** (live per-stage cards via socket+poll), **Machines_data** (per-machine discovered fields + schema), **History** (per-Pipe-ID timeline across all 21 stages).

---

## 5. Concrete `cng_*` Prisma schema

```prisma
// All cng_* tables. No relations/FKs into MINDA tables. Identity = pipeId.

model cng_cylinder {
  id              Int               @id @default(autoincrement())
  pipeId          String            @unique          // THE identity — everything attaches here
  status          String            @default("in_process") // in_process | completed | scrapped
  currentStageNo  Int?                               // latest stage reached (1..21)
  startedAt       DateTime          @default(now())  // created at stage 1 (Pipe Cutting, MANUAL)
  completedAt     DateTime?
  latestData      Json?                              // denormalized latest clean metrics (fast card reads)
  stageRecords    cng_stage_record[]
  defects         cng_defect[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  @@index([status])
  @@index([currentStageNo])
}

model cng_machine {
  id           Int                  @id @default(autoincrement())
  machineId    String               @unique          // resolved from EKC/JCI alias keys
  name         String?
  machineType  String?                               // derived: strip 'ekc_' + trailing _NN
  dialect      String?                               // 'EKC' | 'JCI' | null
  stageNo      Int?                                  // which of the 21 stages this machine feeds (2..21)
  status       String               @default("unknown") // running|idle|offline|disconnected (derived)
  metricsSeen  Json?                                 // accumulated field keys ever seen ($addToSet equiv)
  thresholds   Json?                                 // {pressureMax:..., temperatureMax:...} for breach highlight
  lastSeenAt   DateTime?
  readings     cng_machine_reading[]
  stageRecords cng_stage_record[]
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
  @@index([stageNo])
  @@index([status])
}

// RAW STORE — verbatim packet, append-only, projected out of list reads
model cng_machine_reading {
  id          Int          @id @default(autoincrement())
  machineId   String                                 // string join to cng_machine.machineId
  pipeId      String?                                // resolved if present in payload
  rawPayload  Json                                   // <-- EKC's Telemetry.raw  (accept everything)
  data        Json                                   // <-- extracted measurement bag
  flags       Json?                                  // ['missing_machineId','bad_timestamp','fault_sentinel']
  source      String       @default("ingest")        // ingest | manual | migration
  deviceTs    DateTime?                              // from ts/timestamp alias
  serverTs    DateTime     @default(now())           // ingest time (timeField equivalent)
  machine     cng_machine? @relation(fields: [machineId], references: [machineId])
  @@index([machineId, serverTs])                     // latest-per-machine + history
  @@index([pipeId, serverTs])
}

// NORMALIZED STORE — one row per Pipe ID x stage event; cards/dashboards read THIS
model cng_stage_record {
  id          Int           @id @default(autoincrement())
  pipeId      String                                 // identity attach
  stageNo     Int                                    // 1..21 (1 = MANUAL Pipe Cutting)
  stageName   String?                                // 'Pipe Cutting', ...
  machineId   String?                                // null for stage 1 (manual)
  status      String        @default("ok")           // ok | warn | fault
  pressure    Float?                                 // clean, alias-resolved metrics as typed columns
  temperature Float?
  flow        Float?
  depth       Float?
  depthActual Float?
  deviation   Float?                                 // actual - setpoint
  metrics     Json?                                  // any extra clean metrics not promoted to columns
  enteredBy   String?                                // operator id for manual stage 1
  recordedAt  DateTime      @default(now())
  cylinder    cng_cylinder  @relation(fields: [pipeId], references: [pipeId])
  machine     cng_machine?  @relation(fields: [machineId], references: [machineId])
  @@index([pipeId, stageNo])                         // per-Pipe-ID timeline (History module)
  @@index([stageNo, recordedAt])
  @@index([machineId, recordedAt])
}

model cng_defect {
  id          Int          @id @default(autoincrement())
  pipeId      String
  stageNo     Int?
  machineId   String?
  type        String                                 // 'fault_sentinel' | 'out_of_range' | 'junk_value' | 'manual'
  field       String?                                // which metric tripped
  value       Float?
  message     String?
  resolved    Boolean      @default(false)
  detectedAt  DateTime     @default(now())
  cylinder    cng_cylinder @relation(fields: [pipeId], references: [pipeId])
  @@index([pipeId])
  @@index([resolved])
}

// x-api-key store for the ingest endpoint
model cng_ingest_key {
  id          Int       @id @default(autoincrement())
  keyHash     String    @unique                       // store HASH, not plaintext
  label       String?                                 // 'EKC line PLC', 'JCI gateway'
  active      Boolean   @default(true)
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
  expiresAt   DateTime?                               // supports rotation
  @@index([active])
}

// Dead-letter for unparseable JSON (never drop) — EKC Quarantine equivalent
model cng_quarantine {
  id         Int      @id @default(autoincrement())
  rawBytes   String   @db.LongText
  reason     String?
  receivedAt DateTime @default(now())
}
```

Notes consistent with §2–4: `rawPayload`/`data`/`metrics`/`metricsSeen`/`thresholds`/`flags` are all `Json` (MySQL `JSON` = the `Mixed` equivalent); normalized values live in typed columns on `cng_stage_record`; `latestData` on `cng_cylinder` is the denormalized fast-read snapshot (mirrors EKC's cached `MachineSummary.latest_data`); ingest keys are stored hashed with `expiresAt` to support rotation. `cng_quarantine` is included beyond the deck's named tables because EKC's never-drop guarantee requires it — **flag for approval** (it's a `cng_*` table, MINDA-safe).

---

## 6. Open questions / risks / decisions to confirm before building

**Identity & mapping (highest priority — the whole module hinges on these):**
1. **How does a raw EKC/JCI payload carry the Pipe ID?** Today neither EKC nor JCI puts a cylinder/pipe id in the telemetry `data` — EKC links cylinder↔machine via a separate `ProductionRun` (runId, cylinderId, machineId) that **is not populated by the ingest path** (greenfield). So: does the PLC payload include a `pipeId`/barcode field, or must CNG derive the active Pipe ID per machine from a separate "what cylinder is on this machine now" signal? **If the latter, we need a `cng_production_run`-style bridge and a way to set the active Pipe ID per stage.**
2. **Machine → stage mapping.** Is each of stages 2–21 served by exactly one machine (1:1), or can a machine feed multiple stages / a stage have multiple machines? This determines whether `cng_machine.stageNo` is sufficient or we need a mapping table.
3. **Stage 1 (Pipe Cutting) manual entry.** Confirm the UI flow: operator creates the `cng_cylinder` (mints the Pipe ID) and writes the stage-1 `cng_stage_record` by hand. Where does the Pipe ID come from — scanned barcode, sequence, or typed?
4. **Stage sequencing / out-of-order.** Can stage records arrive out of order or be skipped? Should the History timeline enforce 1→21 ordering or just display what arrived?

**Dialect & data quality:**
5. **Which CNG field aliases / setpoint-actual pairs are real?** EKC's only locked pairs are `depth` and `servoSlow`, and **all current actuals equal setpoints (deviations are 0 — data is steady-state/simulated)**. We must get genuine CNG field names (pressure, fill volume, gas flow, leak test) before building any deviation/alerting logic.
6. **Raw PLC dump tolerance.** EKC's `BOTTOMMILLING2` sends ~3,504 register keys (D/M/X/Y/T/C). Confirm CNG machines send named feeds vs raw dumps so we size the field-rendering cap and the `data`/`rawPayload` JSON column expectations.
7. **Fault sentinels & junk values.** Confirm the sentinel set (`-32768/32767/65535`) and junk-negative handling apply to CNG hardware so `cng_defect` rules are correct.

**Auth, ops, infra:**
8. **API-key rotation policy.** EKC/JCI run **open** when no keys are configured (committed `.env` left `INGEST_KEY` empty — wide open). CNG should ship **closed**: store hashed keys in `cng_ingest_key`, support `expiresAt`/overlap rotation, and decide whether "no active keys = closed" (recommended) vs EKC's "no keys = open."
9. **Normalize at ingest vs read-time.** This brief proposes **write-back normalization** (persist clean columns at ingest) for indexed MySQL queries, diverging from EKC/JCI's pure read-time derivation. Confirm acceptable — it means re-running normalization (or a migration) if alias lists change. (Mitigation: `rawPayload` is retained, so reprocessing is always possible.)
10. **Latest-value strategy & "live."** EKC computes latest per-machine (sort desc limit 1) to dodge Atlas limits; we'll instead keep `latestData` snapshots + indexed `serverTs`. Confirm "live" = socket nudge + 8s poll is acceptable (the proven pattern), vs payload-bearing sockets / per-Pipe-ID rooms.
11. **Quarantine table.** Confirm adding `cng_quarantine` (not in the deck's named list) is OK to honor the never-drop guarantee.
12. **Backfill / migration.** Is there existing EKC/JCI telemetry (e.g. `test.payloads`) to backfill into `cng_*`, or does CNG start clean? EKC has a `migrate-test-payloads.mjs` precedent if backfill is wanted.
13. **No cross-DB FKs.** Operators/users referenced in `cng_stage_record.enteredBy` and `cng_machine` ownership must be **string ids only** (no FK into MINDA user tables) — confirm how CNG resolves/authorizes operators against the existing JP Minda auth without a relation.

---

Sources cited inline: JCI `smartfactory/server/src/routes/ingest.ts`, `models/Telemetry.ts`, `lib/derive.ts`, `client/src/pages/Machines.tsx` (under the scratchpad `sff2/...` extraction); EKC `D:/ekc-api/ekc-smartfactory/server/src/lib/ingestService.js`, `models/Telemetry.js`, `lib/derive.js`, `shared/index.js`, `models/ProductionRun.js`, `client/src/pages/Machines.jsx`, `client/src/hooks/useMachines.js`; EKC fullstack `D:/ekc-api/ekc-fullstack/server/src/services/ingest.service.ts`, `schema.service.ts`, `socket/telemetry.socket.ts`; `ekc-rhl` `D:/ekc-rhl/server/src/utils/normalize.ts`, `flatten.ts`, `client/src/lib/params.ts`, `headline.ts`, `format.ts`.