# CNG Cylinder Tracking — SAP Data Integration

**How SAP should push machine & cylinder data to the JP Minda CNG platform**
Prepared by Deepnap Softech · for Jay Fe Cylinders / JP Minda Group · v1.0

> Editable source for `SAP_Data_Integration_Spec.pdf` (the version to email the SAP team).

## 1. Overview
SAP sends **one message per machine** — the machine's current reading plus the cylinder (Pipe ID) it is working on — to a single secure HTTPS endpoint as JSON (`POST`). We receive it, store it, and it appears live on the cylinder dashboard. You don't need a rigid schema; map your SAP fields to the simple shape below.

## 2. Endpoint & authentication
| Item | Value |
|---|---|
| URL | `POST https://digitisationapi.jpmgroup.co.in/api/v1/sap/ingest` |
| Method | `POST` |
| Auth header | `x-api-key: <the key Deepnap issues you>` |
| Content-Type | `application/json` |

## 3. Request body — one machine per message
```json
{
  "machineId":   "HARDNESS-01",
  "machineName": "Hardness Tester",
  "stageNo":     7,
  "pipeId":      "PIPE-60-V48002",
  "timestamp":   "2026-07-01T10:15:00Z",
  "data": {
    "hardness": 92,
    "result":   "PASS",
    "status":   "running"
  }
}
```

## 4. Field guide
| Field | Required | Meaning |
|---|---|---|
| `machineId` | **required** | Unique code for the machine (any naming, kept consistent). |
| `pipeId` | **required** | The cylinder / Pipe ID this machine is working on **right now** — links every reading to the correct cylinder. |
| `timestamp` | **required** | When the reading was taken — ISO-8601 (e.g. `2026-07-01T10:15:00Z`). |
| `stageNo` | recommended | Which of the 21 stages this machine feeds (1–21). If omitted, we map it from the machine. |
| `machineName` | optional | Friendly display name. |
| `data` | **required** | The actual readings — **you choose the field names**. Put pass/fail as `result: "PASS"/"FAIL"` and state as `status: "running"/"idle"/"stopped"/"fault"`. |

*You decide the names inside `data`.* Common ones (pressure, temperature, hardness, depth, flow, thickness…) are shown as gauges automatically; any other field is still stored and displayed.

## 5. Rules that keep it clean
- **Always include `pipeId`** — it links the reading to the cylinder (no barcode scanning on our side).
- **One machine per message** — a separate POST per machine reading.
- Send on change, or on a short interval (e.g. every 5–15 s per machine).
- Send over **HTTPS to the domain above** (not an IP address).

## 6. Responses
| Code | Meaning |
|---|---|
| `202 Accepted` | Received and stored. **This is success.** |
| `401 Unauthorized` | Missing or wrong `x-api-key`. |
| `400 Bad Request` | Body was not valid JSON. |

Any valid JSON with a `machineId` is stored — even unexpected fields.

## 7. Quick test
```bash
curl -X POST https://digitisationapi.jpmgroup.co.in/api/v1/sap/ingest \
  -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"machineId":"TEST-01","pipeId":"PIPE-TEST-1","timestamp":"2026-07-01T10:15:00Z","data":{"pressure":301,"result":"PASS"}}'
```
A `202` with `{"ok":true}` confirms it works end-to-end.

## 8. Go-live checklist
- ☐ Deepnap issues you the `x-api-key`.
- ☐ You map your SAP fields to §3 and send a few test messages.
- ☐ We confirm they arrive (raw log + live on the dashboard).
- ☐ Share your server's outbound source IP so we can whitelist it.
- ☐ Switch all machines to live — done.
