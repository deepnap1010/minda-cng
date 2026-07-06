// src/controller/machineHistory.controller.js
import { AsyncHandler } from "../utils/asyncHandler.js";
import { StatusCodes } from "http-status-codes";
import {
  getMachineHistoryService,
  getMachineSummaryService,
  getMachineLatestStatusService,
  getMachineModelOptionsService,
} from "../services/machineHistory.service.js";
import { getOrSetJSON } from "../utils/redisCache.js";

// Single prefix for everything machine-history related. The PLC POST handler
// in plcData.controller.js invalidates this whole prefix on new data so the
// cache never goes stale beyond one ingest cycle.
//
// IMPORTANT: this must stay in sync with the prefix invalidated in
// plcData.controller.js -> createPlcData().
export const HISTORY_CACHE_PREFIX = "plc-history:";

// Sensible per-endpoint TTLs.
// - records / summary tolerate a couple of minutes of staleness; this is a
//   historical view, not a live feed.
// - latest-status is what flips between Running/Stopped — keep short.
// - models rarely change; cache longer.
const TTL_RECORDS = 120; // 2 min
const TTL_SUMMARY = 180; // 3 min
const TTL_LATEST  = 30;  // 30 sec
const TTL_MODELS  = 600; // 10 min

export const getMachineHistory = AsyncHandler(async (req, res) => {
  const { device_id, status, model, duration, startDate, endDate, page, limit } = req.query;

  if (!device_id) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "device_id is required" });
  }

  const cacheKey = `${HISTORY_CACHE_PREFIX}records:${JSON.stringify({
    device_id, status, model, duration, startDate, endDate, page, limit,
  })}`;

  const { data: result, fromCache } = await getOrSetJSON(cacheKey, TTL_RECORDS, () =>
    getMachineHistoryService(
      { device_id, status, model, duration, startDate, endDate },
      { page, limit }
    )
  );

  res.status(StatusCodes.OK).json({
    message: "Machine history fetched successfully",
    fromCache,
    data: result,
  });
});

export const getMachineSummary = AsyncHandler(async (req, res) => {
  const { device_id, status, model, duration, startDate, endDate } = req.query;

  if (!device_id) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "device_id is required" });
  }

  const cacheKey = `${HISTORY_CACHE_PREFIX}summary:${JSON.stringify({
    device_id, status, model, duration, startDate, endDate,
  })}`;

  const { data: result, fromCache } = await getOrSetJSON(cacheKey, TTL_SUMMARY, () =>
    getMachineSummaryService({ device_id, status, model, duration, startDate, endDate })
  );

  res.status(StatusCodes.OK).json({
    message: "Machine summary fetched successfully",
    fromCache,
    data: result,
  });
});

export const getMachineLatestStatus = AsyncHandler(async (req, res) => {
  const { device_id } = req.query;

  if (!device_id) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "device_id is required" });
  }

  const cacheKey = `${HISTORY_CACHE_PREFIX}latest:${device_id}`;

  const { data: result, fromCache } = await getOrSetJSON(cacheKey, TTL_LATEST, () =>
    getMachineLatestStatusService(device_id)
  );

  res.status(StatusCodes.OK).json({
    message: "Machine latest status fetched successfully",
    fromCache,
    data: result,
  });
});

export const getMachineModelOptions = AsyncHandler(async (req, res) => {
  const { device_id } = req.query;

  if (!device_id) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "device_id is required" });
  }

  const cacheKey = `${HISTORY_CACHE_PREFIX}models:${device_id}`;

  const { data: result, fromCache } = await getOrSetJSON(cacheKey, TTL_MODELS, () =>
    getMachineModelOptionsService(device_id)
  );

  res.status(StatusCodes.OK).json({
    message: "Machine model options fetched successfully",
    fromCache,
    data: {
      models: result,
    },
  });
});