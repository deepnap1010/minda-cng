import { Router } from "express";
import {
  createPlcProduct,
  getAllPlcProducts,
  getPlcProductById,
  updatePlcProduct,
  deletePlcProduct,
} from "../controller/plcProduct.controller.js";

const router = Router();

router.post("/", createPlcProduct);
router.get("/", getAllPlcProducts);
router.get("", getAllPlcProducts);
router.get("/:id", getPlcProductById);
router.put("/:id", updatePlcProduct);
router.delete("/:id", deletePlcProduct);

export default router;
