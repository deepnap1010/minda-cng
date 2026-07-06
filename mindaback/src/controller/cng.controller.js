// CNG controllers. Thin request/response layer over cng.service.js. Mirrors the
// PLC controllers: AsyncHandler wrapper, { message, data } responses, io.emit.

import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { io } from "../server.js";
import * as cng from "../services/cng.service.js";
import { validate, scanSchema, cylinderSchema, keySchema } from "../validation/cng.validation.js";
import { CreateNotification, singleNotification } from "../services/notification.service.js";
import { sendNewNotification } from "../socket/notification.socket.js";
import { GetAdmin, GetAllUsersService } from "../services/users.service.js";

const userId = (req) => req?.currentUser?._id || req?.currentUser?.id || null;

// POST /cng/ingest — machines push telemetry. No JWT; x-api-key instead.
export const createCngData = AsyncHandler(async (req, res) => {
  const auth = await cng.verifyIngestKey(req);
  if (!auth.ok) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ success: false, error: "invalid or missing x-api-key" });
  }

  // Accept a single packet OR a batch (JSON array) — a PLC/gateway may send either.
  const isBatch = Array.isArray(req.body);
  const packets = isBatch ? req.body : [req.body];
  const results = [];

  for (const packet of packets) {
    const result = await cng.ingestReading(packet, { source: packet?.source || "ingest" });
    results.push(result);

    if (io) {
      io.emit("cng:update", {
        entity: "cngReading",
        machineId: result.machineId,
        pipeId: result.pipeId,
        stageNo: result.stageNo,
        status: result.status,
      });
      if (result.advanced) io.emit("cng:stageAdvance", { pipeId: result.pipeId, toStage: result.toStage, machineId: result.machineId });
    }

    // Fire stage-handoff / reject / completion notifications — never block the line.
    emitStageNotifications(result).catch((e) => console.error("cng notify:", e?.message || e));
  }

  // Always 202 for valid JSON — the line never stalls.
  return res.status(StatusCodes.ACCEPTED).json({
    success: true,
    ok: true,
    message: isBatch ? `${results.length} reading(s) stored` : "reading stored",
    count: results.length,
    data: isBatch ? results : results[0],
  });
});

// Create + broadcast one notification, reusing the shared bell/socket pipeline.
async function notify({ reciverId, title, description, type }) {
  if (!reciverId) return;
  const row = await CreateNotification({ title, description, reciverId, senderId: null, status: "send", type, assembly: null, process_id: null, checkList: null });
  const full = await singleNotification(row._id);
  if (full) sendNewNotification(full);
}

// Notify on a real stage handoff (→ that stage's operator) and on reject/completion (→ admin).
async function emitStageNotifications(result) {
  if (!result?.pipeId) return;
  if (result.advanced && result.nextOperatorId) {
    await notify({
      reciverId: result.nextOperatorId,
      title: `Cylinder at your station — Stage ${result.toStage}`,
      description: `Pipe ${result.pipeId} has arrived at Stage ${result.toStage}${result.stageName ? ` (${result.stageName})` : ""}. It is now your job.`,
      type: "cng_stage_moved",
    });
  }
  if (result.rejected || result.completed) {
    const admin = await GetAdmin();
    const adminId = Array.isArray(admin) ? admin[0]?._id : admin?._id;
    if (adminId) {
      await notify({
        reciverId: adminId,
        title: result.completed ? "Cylinder completed" : `Cylinder rejected — Stage ${result.toStage}`,
        description: result.completed
          ? `Pipe ${result.pipeId} has cleared all 21 stages and is accepted.`
          : `Pipe ${result.pipeId} was rejected at Stage ${result.toStage}${result.stageName ? ` (${result.stageName})` : ""} on ${result.machineId}.`,
        type: result.completed ? "cng_complete" : "cng_reject",
      });
    }
  }
}

// PUT /cng/machines/:machineId/operator — assign a standing operator to a machine.
export const setMachineOperator = AsyncHandler(async (req, res) => {
  const { machineId } = req.params;
  const operatorUserId = req.body?.operatorUserId || null;
  const data = await cng.setMachineOperator(machineId, operatorUserId);
  if (io) io.emit("cng:update", { entity: "cngMachine", machineId });
  return res.status(StatusCodes.OK).json({ message: "Operator assigned", data });
});

// GET /cng/operators — users assignable as machine operators (for the picker).
export const getOperators = AsyncHandler(async (_req, res) => {
  const data = await GetAllUsersService();
  return res.status(StatusCodes.OK).json({ message: "OK", data });
});

// POST /cng/scan — operator mounts a cylinder onto a machine (sets active Pipe ID).
export const scanCng = AsyncHandler(async (req, res) => {
  const { machineId, pipeId, stageNo } = await validate(scanSchema, req.body || {});
  const data = await cng.scanIn({ machineId, pipeId, stageNo, userId: userId(req) });
  if (io) io.emit("cng:update", { entity: "cngScan", machineId, pipeId, stageNo });
  return res.status(StatusCodes.OK).json({ message: "Cylinder scanned onto machine", data });
});

// POST /cng/cylinders — stage 1 (Pipe Cutting) manual entry. Mints the Pipe ID
// when none is supplied; returns the existing Stage-1 record read-only if the
// cylinder was already cut (unless allowRevision is set).
export const createCylinder = AsyncHandler(async (req, res) => {
  const { pipeId, metrics, status, line, allowRevision } = await validate(cylinderSchema, req.body || {});
  const data = await cng.createCylinderManual({ pipeId, metrics, status, line, allowRevision, enteredBy: userId(req) });
  if (io) io.emit("cng:update", { entity: "cngCylinder", pipeId: data.pipeId, stageNo: 1 });
  const code = data.alreadyExists ? StatusCodes.OK : StatusCodes.CREATED;
  return res.status(code).json({
    message: data.alreadyExists ? "Cylinder already cut at Stage 1" : "Cylinder created",
    data,
  });
});

export const getStages = AsyncHandler(async (_req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: cng.getStages() })
);

export const getDashboard = AsyncHandler(async (_req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: await cng.getDashboard() })
);

export const getMachines = AsyncHandler(async (_req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: await cng.listMachines() })
);

export const getMachineById = AsyncHandler(async (req, res) => {
  const data = await cng.getMachine(req.params.machineId, { from: req.query.from, to: req.query.to });
  if (!data) return res.status(StatusCodes.NOT_FOUND).json({ message: "Machine not found", data: null });
  return res.status(StatusCodes.OK).json({ message: "OK", data });
});

export const getMachineLatest = AsyncHandler(async (req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: await cng.machineLatest(req.params.machineId) })
);

export const getMachineHistory = AsyncHandler(async (req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: await cng.machineHistory(req.params.machineId, Number(req.query.limit) || 200) })
);

export const getCylinders = AsyncHandler(async (req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: await cng.listCylinders(req.query) })
);

export const getCylinderByPipeId = AsyncHandler(async (req, res) => {
  const data = await cng.getCylinderTrace(req.params.pipeId);
  if (!data) return res.status(StatusCodes.NOT_FOUND).json({ message: "Cylinder not found", data: null });
  return res.status(StatusCodes.OK).json({ message: "OK", data });
});

// GET /cng/stage-records?stage_no=&machine_id=&pipe_id=&limit= — newest first.
// Powers the Cutting Stage Data table on manual stages (operator entries per Pipe ID).
export const getStageRecords = AsyncHandler(async (req, res) => {
  const { stage_no, machine_id, pipe_id, limit } = req.query;
  const data = await cng.listStageRecords({ stageNo: stage_no, machineId: machine_id, pipeId: pipe_id, limit });
  return res.status(StatusCodes.OK).json({ message: "OK", data });
});

export const getDefects = AsyncHandler(async (req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: await cng.listDefects(req.query) })
);

export const createKey = AsyncHandler(async (req, res) => {
  const { label } = await validate(keySchema, req.body || {});
  return res.status(StatusCodes.CREATED).json({ message: "Ingest key created (copy it now — shown once)", data: await cng.createIngestKey(label) });
});

export const getKeys = AsyncHandler(async (_req, res) =>
  res.status(StatusCodes.OK).json({ message: "OK", data: await cng.listIngestKeys() })
);
