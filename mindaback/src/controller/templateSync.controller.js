import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {
  fetchSyncDataService,
  pendingCountService,
} from "../services/templateSync.service.js";

/**
 * GET /sync/templates?limit=&entity_type=
 * Returns ONLY PENDING records (each is then marked SENT, so it is delivered
 * exactly once — when everything has been fetched, count is 0). Minda pushes
 * every returned record to SAP HANA. SENT records older than
 * SAP_SYNC_RETENTION_DAYS (default 10) are purged automatically.
 */
export const pullTemplateSync = AsyncHandler(async (req, res) => {
  const { limit, entity_type } = req.query;
  const data = await fetchSyncDataService({ limit, entity_type });
  res.status(StatusCodes.OK).json({
    success: true,
    count: data.length,
    data,
  });
});

/** GET /sync/templates/pending-count → queue stats (does NOT change any status). */
export const templateSyncPendingCount = AsyncHandler(async (_req, res) => {
  const data = await pendingCountService();
  res.status(StatusCodes.OK).json({ success: true, ...data });
});
