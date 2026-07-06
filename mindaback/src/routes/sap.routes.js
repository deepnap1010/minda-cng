import { Router } from "express";
import { getInbox, getInboxItem, createKey, getKeys } from "../controller/sap.controller.js";

// Mounted at /api/v1/sap behind Authorization (see routes.js). The ingest
// endpoint (/api/v1/sap/ingest) is mounted separately BEFORE auth in routes.js.
const router = Router();

router.get("/inbox", getInbox);
router.get("/inbox/:id", getInboxItem);
router.get("/keys", getKeys);
router.post("/keys", createKey);

export default router;
