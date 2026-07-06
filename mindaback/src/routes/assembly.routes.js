import { Router } from "express";

// ------------------------- local imports -------------------------------
import { Validater } from "../middleware/validator.js";
import { assemblyValidationSchema } from "../validation/AssemblyLine.validation.js";
import { assemblyLineCardsData,  assemblyLineDataTodayReport,  assemblyLineFormResponsibal, createAssembly, deleteAssemblyData, getAllAssemblyData, getAllITemsToCheckTimeBase, getAssemblyData, getAssemblyDataByResponsibal, searchAssemblyData, updateAssemblyData } from "../controller/assembly.controller.js";


const routes = Router();


routes.route("/create-assembly").post(Validater(assemblyValidationSchema),createAssembly);
routes.route("/get-assembly").get(getAssemblyData);
routes.route("/search-assembly-line").get(searchAssemblyData);
routes.route("/delete-assembly/:id").delete(deleteAssemblyData);
routes.route("/update-assembly/:id").put(updateAssemblyData);
routes.route("/get-assembly-data").get(getAllAssemblyData);
routes.route("/get-assembly-responsibal").get(getAssemblyDataByResponsibal);
routes.route("/checklist-form").post(assemblyLineFormResponsibal);
routes.route("/assembly-cards-data").get(assemblyLineCardsData);
routes.route("/assembly-checked-data").get(assemblyLineDataTodayReport);
routes.route("/assembly-checked-data/:assembly_id").get(getAllITemsToCheckTimeBase);


export default routes;