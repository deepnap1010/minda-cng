import { Router } from "express";

// ---------------------- local imports ----------------------------
import { createCheckListHistory,  createCheckListHistoryTiming,  getAllErrorData,  updateCheckListHistory } from "../controller/checkListHistory.controller.js";
import { Validater } from "../middleware/validator.js";
import {checkListHistoryRequestSchema } from "../validation/checkListHistory.validation.js";

const routes = Router();

routes.route("/create-checklist-history").post(Validater(checkListHistoryRequestSchema),createCheckListHistory);
routes.route("/update-checklist-history/:id").put(updateCheckListHistory);
routes.route("/error-history").get(getAllErrorData);
routes.route("/create-checklist-history-timing").post(Validater(checkListHistoryRequestSchema),createCheckListHistoryTiming)


export default routes;

























