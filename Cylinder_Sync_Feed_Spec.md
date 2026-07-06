# CNG Cylinder — Outbound Data Feed (for SAP / JP Minda systems)

**For JP Minda's integration engineers.** This is how your systems **pull** cylinder production data out of the tracking platform — the same mechanism (and the same API key) you already use for the template feed at `/sync/templates`.

---

## 1. Endpoints

| | |
|---|---|
| **Base** | `https://digitisationapi.jpmgroup.co.in/api/v1` |
| **Auth** | header `x-api-key: <SAP sync key>` (identical to the template feed) — or `Authorization: ApiKey <key>` |
| **Method** | `GET` only (this feed is read-only) |

| Endpoint | What it returns |
|---|---|
| `GET /sync/cylinders` | **State stream** — cylinders whose state changed since your cursor (one snapshot per cylinder: current stage, status, latest measurements) |
| `GET /sync/stage-records` | **Event stream** — every per-stage record, append-only (e.g. `?stage_no=1` = every Pipe Cutting entry operators submit) |
| `GET /sync/cylinders/{pipeId}` | **Deep pull** — the full 21-stage trace for one cylinder |

---

## 2. The polling recipe (cursor-based, exactly-once)

1. First call: `GET /sync/cylinders?limit=200` (no cursor → starts from the beginning).
2. From each response take **`nextCursor`** and, while **`hasMore`** is `true`, call again immediately with `?cursor=<nextCursor>`.
3. When `hasMore` is `false`, **persist the last non-null `nextCursor`** and reuse it on your next scheduled poll (e.g. every minute). You will only ever receive what changed since.
4. Treat `cursor` as **opaque** — store and echo it back, don't parse it.

`nextCursor` **never moves backward**: on a quiet poll (0 new rows) it simply echoes your position, so it is always safe to persist. It is `null` only on the very first sync of an empty system — keep polling without a cursor until data appears.

Freshness note: rows enter the feed ~3 seconds after they are written (a small stability window that guarantees no record is ever skipped during concurrent writes).

Same recipe for `/sync/stage-records`. Its rows are immutable events; deduplicate by `recordId` if you ever re-pull.

You can also start from a point in time instead of a cursor: `?since=2026-07-06T00:00:00Z`.

---

## 3. Response shapes

**`GET /sync/cylinders?limit=2`**
```json
{
  "success": true,
  "count": 2,
  "hasMore": true,
  "nextCursor": "2026-07-06T10:12:44.000Z|a1b2c3d4-...",
  "serverTime": "2026-07-06T12:00:01.123Z",
  "data": [
    {
      "pipeId": "PC-L1-260706-0001",
      "status": "in_process",
      "currentStageNo": 6,
      "currentStageName": "Heat Treatment",
      "currentMachineId": "HT-401",
      "latestData": { "heatNo": "H-2214", "od": 356, "furnace_temp": 892 },
      "startedAt": "2026-07-06T08:01:00.000Z",
      "completedAt": null,
      "updatedAt": "2026-07-06T10:12:44.000Z"
    }
  ]
}
```

**`GET /sync/stage-records?stage_no=1&limit=1`** — each operator Pipe Cutting entry:
```json
{
  "success": true,
  "count": 1,
  "hasMore": false,
  "nextCursor": "2026-07-06T08:01:00.000Z|e5f6...",
  "data": [
    {
      "recordId": "e5f6a7b8-...",
      "pipeId": "PC-L1-260706-0001",
      "stageNo": 1,
      "stageName": "Pipe Cutting",
      "machineId": null,
      "status": "ok",
      "metrics": { "heatNo": "H-2214", "batchNo": "B-102", "grade": "34CrMo4", "od": 356, "wall": 7.2, "cutLength": 940 },
      "source": "manual",
      "enteredBy": "<operator user id>",
      "recordedAt": "2026-07-06T08:01:00.000Z"
    }
  ]
}
```

---

## 4. Query parameters

| Param | Applies to | Meaning |
|---|---|---|
| `cursor` | both streams | opaque position from the previous response's `nextCursor` |
| `since` | both streams | ISO-8601 timestamp alternative to `cursor` (first sync / recovery) |
| `limit` | both streams | page size, default 100, max 500 |
| `status` | `/sync/cylinders` | filter: `in_process` \| `completed` \| `scrapped` |
| `stage_no` | `/sync/stage-records` | filter to one stage (1–21); `1` = Pipe Cutting entries |
| `pipe_id` | `/sync/stage-records` | filter to one cylinder |

Errors: `401` bad/missing key · `400` unparseable `cursor`/`since` · `404` unknown `pipeId` on the deep pull.

---

## 5. curl quick test

```bash
curl "https://digitisationapi.jpmgroup.co.in/api/v1/sync/cylinders?limit=5" \
  -H "x-api-key: <SAP_SYNC_KEY>"

curl "https://digitisationapi.jpmgroup.co.in/api/v1/sync/stage-records?stage_no=1&limit=5" \
  -H "x-api-key: <SAP_SYNC_KEY>"
```

*Deepnap Softech — CNG Cylinder Process Tracking for JP Minda Group.*
