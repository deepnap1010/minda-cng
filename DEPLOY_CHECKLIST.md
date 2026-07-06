# Safe Deploy Checklist — merged build → production

**Goal:** put the merged code (teammate's SAP integration + the cylinder module) on the production server **without breaking the live environment.** The golden rule: **deploy the CODE, never your local `.env` or `node_modules`.**

---

## 0. Before you touch prod
- [ ] **Back up** the current production folder (`checklistback` + `CheckList-Frontend`) — a full copy you can roll back to.
- [ ] Note the current prod `.env` values (you will keep them).

---

## 1. Backend (`checklistback` on the server)

**Copy from your merged `mindaback` → prod, these ONLY:**
- [ ] `src/`  (all of it — this is the merged code)
- [ ] `package.json`  (you added `mongoose`)
- [ ] `scripts/`  (the cng-* and sap-setup helpers)

**About `.env`:** `mindaback/.env` is now set to **PRODUCTION** values (`NODE_ENV=production`, cloud Mongo, cloud Redis), so you MAY ship it with the folder — it matches what prod expects. `SAP_SYNC_API_KEY=minda-sap-1245` is kept as-is so Minda's existing polling keeps working (rotate later only in coordination with them).
- [ ] Confirm the ACTIVE lines are the PROD ones (`NODE_ENV=production`, cloud `MONGODB_URI`, cloud `REDIS_URL`); the `# LOCAL DEV:` lines stay commented.

**Do NOT copy across a different OS:**
- [ ] ❌ `node_modules/` — rebuild with `npm install` on the server. (If prod is the same OS as your dev machine and you've always copied the folder whole, it will work — but `npm install` is the safe move, and it's required because you added **mongoose**.)

**Install + tables + restart:**
- [ ] `npm install`   (pulls in mongoose + any deps)
- [ ] **Create the new tables — REQUIRED.** Prod runs `NODE_ENV=production`, which **skips** the boot-time auto-sync, so the new tables will NOT self-create. Run once:
      ```
      node scripts/create-new-tables.js
      ```
      → safely creates `cng_*`, `sap_materials`, `sap_sync_outbox`, `sap_inbox`, `sap_ingest_key` (create-if-not-exists; never alters/drops an existing table or FK). Idempotent — safe to re-run.
- [ ] Restart the app (`pm2 restart <name>` or your process manager).

**Issue the keys:**
- [ ] CNG ingest key for the PLC:  `node scripts/cng-issue-key.js "Plant PLC gateway"` → give the printed key to whoever runs the PLC/edge.
- [ ] SAP sync key: already set as `SAP_SYNC_API_KEY` above → give to Minda's SAP team for the pull feed.

---

## 2. Frontend (`CheckList-Frontend` on the server)
- [ ] Copy your merged `src/` (has the cylinder module) → prod, **or** run `npm run build` and deploy the `dist/`.
- [ ] Do NOT ship the local `.env.development` bypass — production build ignores it, but keep the prod `.env` (`VITE_BACKEND_URL=https://digitisationapi.jpmgroup.co.in/api/v1`).
- [ ] `npm install` then `npm run build` on the server (or upload a locally-built `dist/`).

---

## 3. Post-deploy verification (2 minutes)
- [ ] App boots — logs show `templateSync hooks registered` and `Database sync completed`.
- [ ] `GET /api/v1/sync/templates/pending-count` with the SAP key → `200`; without → `401`.
- [ ] `POST /api/v1/sap/materials/sync` (logged in) → materials load; `GET /api/v1/sap/materials` returns them.
- [ ] `GET /api/v1/cng/dashboard` (logged in) → returns KPIs (cylinder module alive).
- [ ] `POST /api/v1/cng/ingest` with a **valid** CNG key → `202`; with a bad key → `401`.
- [ ] Sidebar shows the **Cylinder** group; **User Role → Add Role** shows the Cylinder pages.

---

## 4. What the three data channels do (don't mix them up)
| Channel | Endpoint | Direction | Key |
|---|---|---|---|
| PLC/cylinder data **in** | `POST /api/v1/cng/ingest` | company/PLC → you | CNG ingest key (`cng_…`) |
| Templates **out** to SAP | `GET /api/v1/sync/templates?x-api-key=…` | Minda pulls from you | `SAP_SYNC_API_KEY` |
| Cylinder data **out** to SAP | `GET /api/v1/sync/cylinders` + `/sync/stage-records` (cursor pull; see Cylinder_Sync_Feed_Spec.md) | Minda pulls from you | `SAP_SYNC_API_KEY` |
| Material master **in** | `POST /api/v1/sap/materials/sync` | SAP → you | user login (admin) |

*Deepnap Softech — CNG Cylinder Process Tracking for JP Minda Group.*
