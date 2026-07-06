import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { io } from "../server.js";
import * as sap from "../services/sap.service.js";

// POST /sap/ingest — SAP pushes data here. No JWT; x-api-key instead.
export const createSapData = AsyncHandler(async (req, res) => {
  const auth = await sap.verifyIngestKey(req);
  if (!auth.ok) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, error: "invalid or missing x-api-key" });
  }
  const result = await sap.ingestSap(req.body, req);
  if (io) io.emit("sap:update", { entity: "sapInbox", id: result.id, docType: result.docType });
  // Always 202 for valid JSON — never make SAP retry on our side.
  return res.status(StatusCodes.ACCEPTED).json({ success: true, ok: true, message: "SAP payload stored", data: result });
});

// Read side (behind login) — inspect what SAP has pushed.
export const getInbox = AsyncHandler(async (req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: await sap.listInbox(req.query) })
);

export const getInboxItem = AsyncHandler(async (req, res) => {
  const data = await sap.getInboxItem(req.params.id);
  if (!data) return res.status(StatusCodes.NOT_FOUND).json({ message: "Not found", data: null });
  return res.status(StatusCodes.OK).json({ message: "OK", data });
});

export const createKey = AsyncHandler(async (req, res) =>
  res.status(StatusCodes.CREATED).json({ message: "SAP ingest key created (copy it now — shown once)", data: await sap.createIngestKey(req.body?.label) })
);

export const getKeys = AsyncHandler(async (_req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: await sap.listIngestKeys() })
);
