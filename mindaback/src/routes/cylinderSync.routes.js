import { Router } from "express";
import {
  pullCylinderSync,
  pullStageRecordSync,
  pullCylinderTraceSync,
} from "../controller/cylinderSync.controller.js";

// Mounted at /sync behind sapSyncApiKey (routes.js), alongside the template
// feed — same key, same consumer (Minda -> SAP HANA). Read-only.
const routes = Router();

routes.get("/cylinders", pullCylinderSync);
routes.get("/cylinders/:pipeId", pullCylinderTraceSync);
routes.get("/stage-records", pullStageRecordSync);

export default routes;
