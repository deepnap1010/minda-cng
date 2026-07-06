import axios from "axios";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config.js";

/**
 * sapClient — the single boundary between our app and SAP.
 *
 * READ side (material master):
 *   - SAP_MODE=offline (default): reads src/config/sap-materials.sample.json,
 *     so the whole feature works without any SAP credentials.
 *   - SAP_MODE=live: pulls from the ZODATA_MAT_API OData v2 service with
 *     paging ($top/$skip) and Basic auth.
 *
 * WRITE side is implemented in sapWriter.js (Phase 4) and selected by
 * SAP_WRITE_MODE (hana | odata | none).
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.join(__dirname, "../config/sap-materials.sample.json");

const isLive = () => config.SAP_MODE === "live" && !!config.SAP_ODATA_BASE_URL;

// Normalize an SAP OData record to our flat shape.
const normalize = (r) => ({
  material: r.Material,
  description: r.Description ?? null,
  material_type: r.MaterialType ?? null,
  base_uom: r.BaseUOM ?? null,
});

async function readFixture() {
  const raw = await readFile(FIXTURE_PATH, "utf-8");
  return JSON.parse(raw).map(normalize);
}

/**
 * Fetch ALL materials from live SAP, paging until the service returns fewer
 * than `pageSize` rows. OData v2 wraps rows in { d: { results: [...] } }.
 */
async function fetchLiveMaterials({ pageSize = 500 } = {}) {
  const auth =
    config.SAP_ODATA_USER && config.SAP_ODATA_PASSWORD
      ? { username: config.SAP_ODATA_USER, password: config.SAP_ODATA_PASSWORD }
      : undefined;

  const base = config.SAP_ODATA_BASE_URL.replace(/\/$/, "");
  const url = `${base}/ZODATA_MAT_API`;

  const all = [];
  let skip = 0;
  // Hard stop after 200 pages (100k rows) as a runaway guard.
  for (let page = 0; page < 200; page++) {
    const { data } = await axios.get(url, {
      params: { $format: "json", $top: pageSize, $skip: skip },
      auth,
      timeout: 60000,
    });
    const rows = data?.d?.results ?? [];
    all.push(...rows.map(normalize));
    if (rows.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

export const sapClient = {
  mode: () => (isLive() ? "live" : "offline"),

  /** Return the full material master (live SAP or offline fixture). */
  async getAllMaterials(opts) {
    return isLive() ? fetchLiveMaterials(opts) : readFixture();
  },
};
