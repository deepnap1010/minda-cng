# Run the JP Minda platform in Docker

A one-command dev environment so everyone runs the **same** stack — no local
Node / SQL Server / Redis setup to fight with. This is the recommended way to run
the project if your local machine "isn't working properly."

## What you get
| Service | What | URL / port |
|---|---|---|
| `frontend` | React + Vite dev server | http://localhost:5180 |
| `backend` | Express API (auto-reloads on save) | http://localhost:9021 |
| `mssql` | **SQL Server 2025** (required — the app uses the native `JSON` column type) | localhost:1433 |
| `redis` | cache / sessions | localhost:6379 |

On startup the backend waits for SQL Server, creates the `JPMDO` database if it's missing (`scripts/docker-init-db.js`), then boots and auto-creates all tables.

> ⚠️ **SQL Server 2025 is required.** The models use the native `JSON` column type, which does **not** exist in SQL Server 2019/2022. If your local system "wasn't working," a wrong SQL Server version is a likely cause — this stack pins the correct one.

## Prerequisites
- **Docker Desktop** (Windows/Mac/Linux).
- Give Docker **at least 4 GB RAM** (SQL Server needs ~2 GB). Docker Desktop → Settings → Resources → Memory.

## Start it
From the project root (the folder with `docker-compose.yml`):

```bash
docker compose up --build
```

First run pulls images + installs dependencies inside the containers (a few
minutes). When it settles you'll see the backend log `Database sync completed`.
Open **http://localhost:5180**.

Stop with `Ctrl+C`, or run detached with `docker compose up --build -d`.

## One thing to set on the frontend
The browser calls the API directly, so make sure **`CheckList-Frontend/.env.development`** contains:

```
VITE_BACKEND_URL=http://localhost:9021/api/v1
```

(If the file doesn't exist, create it with that one line.)

## First-run: create a login user
Fresh database = empty tables. Seed a demo user once the stack is up:

```bash
docker compose exec backend npm run cng-seed-user
```

Then log in at http://localhost:5180 with the credentials it prints.

## Everyday commands
```bash
docker compose up --build          # start (rebuild if Dockerfiles/deps changed)
docker compose up -d               # start in the background
docker compose logs -f backend     # follow backend logs
docker compose exec backend sh     # shell into the backend container
docker compose down                # stop (keeps the database volume)
docker compose down -v             # stop AND wipe the DB + node_modules volumes (full reset)
```

## Environment
Backend config is **`mindaback/.env.docker`** — it points at the `mssql` and
`redis` service names (not `localhost`) and contains **dev-only placeholders, no
production secrets**. Fill these in only if you need those features:
- `MONGODB_URI` — raw CNG telemetry (optional; blank = off, app still runs).
- `EMAIL_AUTH` / `EMAIL_PASSWORD` — outbound email.
- `TIMELABS_*` — HR SSO.

Do **not** put production credentials in `.env.docker` — it's meant to be shared.

## Troubleshooting
- **`mssql` keeps restarting / exits code 1** → not enough memory. Raise Docker's RAM to 4 GB+.
- **Can't pull `mssql/server:2025-latest`** → check the current 2025 tag at `mcr.microsoft.com/mssql/server` and update the image line in `docker-compose.yml`. The version must be **2025 or newer** (native JSON type).
- **Port already in use (1433 / 6379 / 9021 / 5180)** → stop whatever's using it locally, or change the left-hand side of the `ports:` mapping in `docker-compose.yml` (e.g. `"14330:1433"`).
- **Backend can't reach the DB on first boot** → harmless; it retries every 5 s until SQL Server finishes starting. Watch `docker compose logs -f backend`.
- **Changed dependencies but they're not picked up** → `docker compose build backend` (or `frontend`), or full reset with `docker compose down -v && docker compose up --build`.
- **Frontend loads but API calls fail** → confirm the `VITE_BACKEND_URL` line above and that the `backend` container is healthy.

*Deepnap Softech — JP Minda platform.*
