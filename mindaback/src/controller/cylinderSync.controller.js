// Outbound cylinder->SAP pull feed controllers. Same auth + response style as
// templateSync.controller.js ({ success, count, data }); read-only end to end.

import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {
  pullCylinders,
  pullStageRecords,
  pullCylinderTrace,
} from "../services/cylinderSync.service.js";

const badCursor = (res) =>
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    error: "invalid cursor/since — pass the nextCursor from the previous response, or an ISO-8601 timestamp as since",
  });

/**
 * GET /sync/cylinders?cursor=&since=&status=&limit=
 * STATE stream: cylinders whose state changed after the cursor, oldest first.
 * Poll recipe: keep calling with nextCursor while hasMore=true; persist the
 * final nextCursor and reuse it on the next poll. No cursor = full sync.
 */
export const pullCylinderSync = AsyncHandler(async (req, res) => {
  const { cursor, since, status, limit } = req.query;
  const result = await pullCylinders({ cursor, since, status, limit });
  if (result.badCursor) return badCursor(res);
  return res.status(StatusCodes.OK).json({
    success: true,
    count: result.data.length,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
    serverTime: new Date().toISOString(),
    data: result.data,
  });
});

/**
 * GET /sync/stage-records?cursor=&since=&stage_no=&pipe_id=&limit=
 * EVENT stream: append-only per-stage records (e.g. stage_no=1 = every pipe
 * cutting entry operators submit). Dedupe by recordId.
 */
export const pullStageRecordSync = AsyncHandler(async (req, res) => {
  const { cursor, since, stage_no, pipe_id, limit } = req.query;
  const result = await pullStageRecords({ cursor, since, stageNo: stage_no, pipeId: pipe_id, limit });
  if (result.badCursor) return badCursor(res);
  if (result.badParam) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: result.badParam });
  return res.status(StatusCodes.OK).json({
    success: true,
    count: result.data.length,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
    serverTime: new Date().toISOString(),
    data: result.data,
  });
});

/** GET /sync/cylinders/:pipeId → full 21-stage trace for one cylinder. */
export const pullCylinderTraceSync = AsyncHandler(async (req, res) => {
  const data = await pullCylinderTrace(req.params.pipeId);
  if (!data) return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Cylinder not found" });
  return res.status(StatusCodes.OK).json({ success: true, data });
});
