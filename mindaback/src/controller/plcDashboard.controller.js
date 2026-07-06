// src/controller/plcDashboard.controller.js
import { AsyncHandler } from "../utils/asyncHandler.js";
import { StatusCodes } from "http-status-codes";
import { getAllPlcDashboardService, getPlcDashboardOptionsService } from "../services/plcDashboard.service.js";
import { getOrSetJSON } from "../utils/redisCache.js";

// Cache under the same 'plc-dashboard:' prefix that createPlcData/update/delete
// already invalidate (cacheDelByPrefix in plcData.controller.js), so a new PLC
// POST automatically refreshes these on the next request.
//
// Previously these two endpoints had NO caching at all — the Plc Dashboard page
// hit the DB on every single load (the grid query + 4 DISTINCT option queries),
// which is the main reason that page felt slow.
const DASHBOARD_CACHE_PREFIX = "plc-dashboard:";
const DASHBOARD_GRID_TTL = 60;     // grid cards — keep fairly live
const DASHBOARD_OPTIONS_TTL = 600; // company/plant/model lists rarely change

/**
 * GET /plc-dashboard — latest state of all machines from plc_dashboard table.
 */
export const getPlcDashboard = AsyncHandler(async (req, res) => {
  const {
    device_id,
    status,
    company_name,
    plant_name,
    page = 1,
    limit = 6,
  } = req.query;

  const filters = { device_id, status, company_name, plant_name };
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 6;

  const cacheKey = `${DASHBOARD_CACHE_PREFIX}grid:${JSON.stringify({
    filters,
    page: pageNum,
    limit: limitNum,
  })}`;

  const { data: result, fromCache } = await getOrSetJSON(cacheKey, DASHBOARD_GRID_TTL, () =>
    getAllPlcDashboardService(filters, { page: pageNum, limit: limitNum })
  );

  res.status(StatusCodes.OK).json({
    message: "PLC Dashboard data fetched successfully",
    fromCache,
    data: result?.rows || result || [],
    pagination: result?.pagination || {
      page: pageNum,
      limit: limitNum,
      totalPages: 1,
      totalItems: result?.rows?.length || 0,
    },
  });
});

/**
 * GET /plc-dashboard/options — filter dropdown options.
 */
export const getPlcDashboardOptions = AsyncHandler(async (req, res) => {
  const cacheKey = `${DASHBOARD_CACHE_PREFIX}options`;

  const { data: options, fromCache } = await getOrSetJSON(
    cacheKey,
    DASHBOARD_OPTIONS_TTL,
    () => getPlcDashboardOptionsService()
  );

  res.status(StatusCodes.OK).json({
    message: "Dashboard filter options fetched successfully",
    fromCache,
    data: options,
  });
});