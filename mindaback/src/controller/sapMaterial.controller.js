import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError } from "../utils/errorHandler.js";
import {
  searchMaterialsService,
  getMaterialByKeyService,
  getMaterialTypesService,
  syncMaterialsService,
} from "../services/materialSync.service.js";

/** GET /sap/materials?search=&type=&includeInactive=&limit=  → dropdown options */
export const searchMaterials = AsyncHandler(async (req, res) => {
  const { search, type, includeInactive, limit } = req.query;
  const data = await searchMaterialsService({
    search,
    type,
    includeInactive: includeInactive === "true",
    limit,
  });
  res.status(StatusCodes.OK).json({ success: true, data });
});

/** GET /sap/materials/:material  → single record for companion auto-fill */
export const getMaterial = AsyncHandler(async (req, res) => {
  const { material } = req.params;
  const data = await getMaterialByKeyService(decodeURIComponent(material));
  if (!data) throw new NotFoundError("Material not found", "getMaterial() method error");
  res.status(StatusCodes.OK).json({ success: true, data });
});

/** GET /sap/material-types  → distinct types for an optional filter */
export const getMaterialTypes = AsyncHandler(async (_req, res) => {
  const data = await getMaterialTypesService();
  res.status(StatusCodes.OK).json({ success: true, data });
});

/** POST /sap/materials/sync  → manually trigger a pull from SAP (or fixture) */
export const syncMaterials = AsyncHandler(async (_req, res) => {
  const result = await syncMaterialsService();
  res.status(StatusCodes.OK).json({
    success: true,
    message: `Synced ${result.upserted} materials from ${result.source} source`,
    data: result,
  });
});
