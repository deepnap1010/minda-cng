import { Router } from "express";
import {
  createQualityCheck,
  getAllQualityChecks,
  getQualityCheckById,
  updateQualityCheck,
  deleteQualityCheck,
} from "../controller/qualityCheck.controller.js";

const router = Router();

router.post("/", createQualityCheck);
router.get("/", getAllQualityChecks);
router.get("/:id", getQualityCheckById);
router.put("/:id", updateQualityCheck);
router.delete("/:id", deleteQualityCheck);

export default router;
