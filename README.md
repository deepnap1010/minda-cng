# JFE TraceLine

Cylinder traceability + live machine‑monitoring platform for **Jay Fe Cylinders Limited (JPM Group)**, a CNG cylinder manufacturer. Built by **ITSYBIZZ AI Private Limited**.

Every cylinder gets a unique serial at the **Pipe Cutting** stage and is tracked across **23 manufacturing stages**. Machines report data per cylinder (and optionally continuous telemetry). Plant admins / QA use it on shop‑floor touch panels and in the office.

> Standalone app, same stack as the existing `jpmgroup.co.in` platform, fully env‑configured so it can later drop into that infra. Auth is JWT‑stubbed for now (swap to JPM SSO later).

---

## Stack

| Layer        | Tech |
|--------------|------|
| **Backend**  | Node.js + Express (TypeScript), Sequelize → **Microsoft SQL Server** (`tedious`), **Redis** (ioredis), **Socket.io**, `zod`, `pino`, PM2‑ready |
| **Frontend** | React + TypeScript + **Vite**, Tailwind CSS, `react-router-dom`, **TanStack Query**, `socket.io-client` |
| **Repo**     | npm workspaces monorepo |

```
jfe-traceline/
  server/        # Express + Sequelize + MSSQL + Redis + Socket.io
  client/        # React + TS + Vite + Tailwind
  package.json   # workspaces + root dev script (concurrently)
  docker-compose.yml  # local MSSQL + Redis
  .env.example
  ecosystem.config.js # PM2
  README.md
```

---

## Prerequisites

- **Node.js ≥ 20** (built/tested on Node 22)
- **Microsoft SQL Server** and **Redis** — the easiest way is the bundled `docker-compose.yml` (needs Docker Desktop running). You can also point `.env` at any existing MSSQL/Redis.

---

## Quick start

```bash
# 1. install (root installs both workspaces)
npm install

# 2. env
cp .env.example .env          # Windows: copy .env.example .env

# 3. infrastructure (MSSQL + Redis) — needs Docker running
npm run infra:up              # docker compose up -d
#    ...wait ~30s for SQL Server to become healthy on first boot.

# 4. seed the database (idempotent — safe to re-run)
npm run seed

# 5. run server + client together
npm run dev
```

- API:    http://localhost:4000  (health: `GET /api/health`)
- Client: http://localhost:5173

The Vite dev server **proxies** `/api` and `/socket.io` to the API, so no client env is needed in dev.

> The server connects to MSSQL/Redis **non‑fatally**: if infra is down it still boots and serves `/api/health` and the UI shell, logging a clear warning. Bring infra up + re‑seed and it lights up.

### Running the live simulator (no PLC required)

Streams stage events + telemetry to the ingest endpoints so gauges float and the live stage updates, exactly like a real machine feed:

```bash
npm run simulate
```

---

## MSSQL connection

Configured entirely via `.env` (see `.env.example`). Connection‑string shape:

```
Server=tcp:{DB_HOST},{DB_PORT};Database={DB_NAME};User Id={DB_USER};Password={DB_PASSWORD};Encrypt={DB_ENCRYPT};TrustServerCertificate={DB_TRUST_SERVER_CERT}
```

- For the bundled docker container: `Encrypt=false`, `TrustServerCertificate=true`.
- For Azure SQL / TLS endpoints: set `DB_ENCRYPT=true`.
- The database (`DB_NAME`, default `jfe_traceline`) is **auto‑created on first boot** if missing.

## Redis

`REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` in `.env`. Holds the latest live value per station/machine (`latest:{key}` hashes) and acts as a cache. Live values fall back gracefully when Redis is unavailable.

---

## Core principles (enforced in code)

1. **Schema‑agnostic stage data** — machine fields live in a single `data` JSON column on `StageRecord` (MSSQL `NVARCHAR(MAX)`). Never hardcoded as columns.
2. **Raw‑first ingest** — every inbound POST is written verbatim to `RawInbox` *before* parsing. Parse failures never lose data and never 5xx the caller.
3. **Append‑only records** — `StageRecord` / test results are append‑only (no UPDATE/DELETE endpoints), per IS 15490. Corrections add a new record + `AuditLog` entry.
4. **Traceability by serial** — the cylinder serial (e.g. `Pipecutting1-60-V48002`) is the spine.
5. **Config over hardcode** — DB, Redis, ports, CORS, per‑machine headline metric & gauge ranges all come from env / the `Machine` master table.

---

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | server + client together (concurrently) |
| `npm run dev:server` / `npm run dev:client` | one side only |
| `npm run build` | build server (tsc) + client (vite) |
| `npm run seed` | idempotent seed of stations, model specs, machines, cylinders |
| `npm run simulate` | stream fake PLC data to the ingest endpoints |
| `npm run typecheck` | typecheck both workspaces |
| `npm run infra:up` / `infra:down` | start/stop MSSQL + Redis via Docker |

---

## Theme

Ships with a **light / white theme as the default**, with the original dark
control-room theme one click away via the toggle in the top bar (sun/moon).
The choice is persisted to `localStorage` (`jfe-theme`). Both themes are driven
entirely by CSS variables in `client/src/index.css` (`:root` = light,
`:root[data-theme="dark"]` = dark) — add a theme by adding one variable block.

## Out of scope (Phase 2+ — scaffolded only)

- Assembly phase (valve fitting, N₂ filling, PDI, dispatch).
- OEM EDI / barcode label integration (Maruti / Tata).
- Public verification page — `GET /api/verify/:token` stub + non‑sequential token present, marked TODO.
- JPM SSO — JWT stub structured for later swap.
