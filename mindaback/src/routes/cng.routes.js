import { Router } from "express";
import {
  scanCng,
  createCylinder,
  getStages,
  getDashboard,
  getMachines,
  getMachineById,
  getMachineLatest,
  getMachineHistory,
  setMachineOperator,
  getOperators,
  getCylinders,
  getCylinderByPipeId,
  getStageRecords,
  getDefects,
  createKey,
  getKeys,
} from "../controller/cng.controller.js";

// Mounted at /api/v1/cng behind Authorization (see routes.js). The ingest
// endpoint (/api/v1/cng/ingest) is mounted separately BEFORE auth in routes.js.
const router = Router();

router.get("/stages", getStages);
router.get("/dashboard", getDashboard);

router.get("/operators", getOperators);
router.get("/machines", getMachines);
router.get("/machines/:machineId/latest", getMachineLatest);
router.get("/machines/:machineId/history", getMachineHistory);
router.get("/machines/:machineId", getMachineById);
router.put("/machines/:machineId/operator", setMachineOperator);

router.get("/cylinders", getCylinders);
router.post("/cylinders", createCylinder); // stage 1 manual entry
router.get("/cylinders/:pipeId", getCylinderByPipeId);
router.get("/stage-records", getStageRecords); // Cutting Stage Data table (manual stages)

router.post("/scan", scanCng); // operator mounts a cylinder onto a machine

router.get("/defects", getDefects);

router.get("/keys", getKeys);
router.post("/keys", createKey);

export default router;
