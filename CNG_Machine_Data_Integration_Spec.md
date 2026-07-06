# CNG Cylinder Process — Machine Data Integration

**How to send live machine data to the JP Minda CNG platform**
Prepared by Deepnap Softech · for Jay Fe Cylinders / JP Minda Group · v1.0

> Editable source for `CNG_Machine_Data_Integration_Spec.pdf` (the version to email the company).

## 1. Overview
Each machine on the CNG line sends its readings to **one secure HTTPS endpoint** as JSON via a simple `POST`. That is the entire integration. You do **not** need to match a fixed schema, share database credentials, or open inbound access to your network — your machines (or a gateway PC) simply **push** data out to us.

**Accept-everything:** you choose the field names. We accept any shape and store it as-is. New or changed fields never break anything.

## 2. Endpoint & authentication
| Item | Value |
|---|---|
| URL | `POST https://digitisationapi.jpmgroup.co.in/api/v1/cng/ingest` *(final URL confirmed by Deepnap)* |
| Method | `POST` |
| Auth header | `x-api-key: <the key we issue you>` |
| Content-Type | `application/json` |

## 3. Request body
| Field | Required | Meaning |
|---|---|---|
| `machineId` | **required** | Unique id for the machine (any naming, e.g. `HARDNESS-01` or `ekc_bottom_milling_01`). |
| `timestamp` | **required** | When the reading was taken (ISO-8601 `2026-06-29T10:15:00Z`, or an epoch number). |
| `pipeId` | optional | The cylinder's Pipe ID / barcode, *if the machine knows which cylinder it is measuring* (see §6). |
| `data` | **required** | Object of the actual readings. **You decide the field names inside here.** |

*Naming is flexible:* both `machineId`/`timestamp` (camelCase) and `machine_id`/`ts` (snake_case) are accepted. Send whatever your PLC already produces.

## 4. Examples
```json
// Hardness tester
{ "machineId": "HARDNESS-01", "timestamp": "2026-06-29T10:15:00Z", "pipeId": "PIPE-12345",
  "data": { "hardness": 92, "status": "running" } }

// Bottom milling machine (snake_case is fine too)
{ "machine_id": "ekc_bottom_milling_01", "ts": "2026-06-29T10:15:01Z", "pipe_id": "PIPE-12346",
  "data": { "depth_of_cutting": 5.1, "depth_actual": 5.0, "servo_slow": 14 } }
```

## 5. How often to send
One request **per machine**, every **5–15 seconds** (or on each change). Each request is one snapshot of that machine's current values.

## 6. Linking a reading to a cylinder (Pipe ID)
Telemetry carries a *machine* id but usually not a *cylinder* id. So we need ONE of these — confirm which your line can do:
- **Option A — include `pipeId` in the payload:** if the machine reads the cylinder's barcode/serial, send it. Simplest and most accurate.
- **Option B — scan-in:** an operator scans the cylinder onto the machine at each stage; our system attaches that machine's readings to that cylinder automatically. No payload change.

## 7. Responses
| Code | Meaning |
|---|---|
| `202 Accepted` | Reading received and stored. **This is success.** |
| `401 Unauthorized` | Missing or wrong `x-api-key`. |
| `400 Bad Request` | Body was not valid JSON. |

Any valid JSON with a `machineId` and `data` is stored — even unexpected fields. The line never stalls.

## 8. Security & what we do NOT need
- Keep the `x-api-key` secret; send only over HTTPS. If a key is exposed, tell us — we deactivate it and issue a new one.
- We do **not** need: a fixed data schema, database credentials, or inbound access into your plant network. Your side only makes an outbound HTTPS call.

## 9. Quick test
```bash
curl -X POST https://digitisationapi.jpmgroup.co.in/api/v1/cng/ingest \
  -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"machineId":"TEST-01","timestamp":"2026-06-29T10:15:00Z","data":{"pressure":301}}'
```
A `202` with `{"ok":true}` confirms the integration works end-to-end.

## 10. Go-live checklist
- ☐ Deepnap issues you an `x-api-key`.
- ☐ You confirm the Pipe ID method (Option A or B, §6).
- ☐ You send a few test packets; we confirm they arrive (raw + on the dashboard).
- ☐ Point all machines at the endpoint — done.
