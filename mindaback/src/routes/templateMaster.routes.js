import { Router } from "express";
import {
  addFieldToTemplate,
  createTemplate,
  deleteField,
  deleteTemplate,
  getTemplateById,
  listTemplates,
  updateField,
  updateTemplate,
  getAssignedTemplates,
  getTemplateStatusList,
  getTemplateWorkflowStatus,
  assignWorkflowToTemplate,
  updateAssignedUserStatus,
} from "../controller/templateMaster.controller.js";

const router = Router();

// Less specific routes first (without parameters)
router.post("/templates", createTemplate);
router.get("/templates", listTemplates);
router.get("/assigned-templates", getAssignedTemplates);
router.get("/template-status", getTemplateStatusList);

// More specific routes (with parameters) - must come after less specific ones
router.post("/templates/:id/fields", addFieldToTemplate);
router.post("/templates/:templateId/assign-workflow", assignWorkflowToTemplate);
router.put("/templates/:id/assigned-users/status", updateAssignedUserStatus);
router.get("/templates/:id/workflow-status", getTemplateWorkflowStatus);
router.get("/templates/:id", getTemplateById);
router.put("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);

// Field routes
router.put("/fields/:fieldId", updateField);
router.delete("/fields/:fieldId", deleteField);


export default router;

