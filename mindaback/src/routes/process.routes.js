import {Router} from "express";

// ------------------------- local imports -------------------
import { Validater } from "../middleware/validator.js";
import { processValidationSchema } from "../validation/process.validation.js";
import { createProcess, deleteProcess, getAllProcess, getProcess, getProcessbySearch, updateProcess } from "../controller/process.controller.js";


const routes = Router();


routes.route("/create-process").post(Validater(processValidationSchema),createProcess);
routes.route("/get-process-list").get(getProcess);
routes.route("/saerch-process-list").get(getProcessbySearch);
routes.route("/delete-process/:id").delete(deleteProcess);
routes.route("/update-process/:id").put(updateProcess);
routes.route("/get-all-process").get(getAllProcess)





export default routes;