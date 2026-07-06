import { Router } from "express";
import {
  createWorkflowController,
  getWorkflowListController,
  getWorkflowByIdController,
  updateWorkflowController,
  deleteWorkflowController,
  searchWorkflowController,
} from "../controller/workflow.controller.js";
import { Validater } from "../middleware/validator.js";
import { workflowValidationSchema } from "../validation/workflow.validation.js";

const router = Router();

router.route("/create-workflow").post(
  Validater(workflowValidationSchema),
  createWorkflowController
);
router.route("/list-workflow").get(getWorkflowListController);
router.route("/get-workflow/:id").get(getWorkflowByIdController);
router.route("/update-workflow/:id").put(
  Validater(workflowValidationSchema),
  updateWorkflowController
);
router.route("/delete-workflow/:id").delete(deleteWorkflowController);
router.route("/search-workflow").get(searchWorkflowController);






export default router;
