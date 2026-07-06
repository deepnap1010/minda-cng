import { Router } from "express";

// ---------------------------- local imports ---------------------------
import { CreateChecklistData, DeleteCheckList, GetCheckList, searchCheckList, UpdateCheckListData } from "../controller/checklist.controller.js";
import { Validater } from "../middleware/validator.js";
import { checkListValidationSchema } from "../validation/checkList.validation.js";
import { upload } from "../config/multer.config.js";

const routes = Router();

routes.route("/create-checklist").post(upload.single("file"),Validater(checkListValidationSchema),CreateChecklistData);
routes.route("/update-checklist/:id").put(upload.single("file"),Validater(checkListValidationSchema),UpdateCheckListData);
routes.route("/delete-checklist/:id").delete(DeleteCheckList);
routes.route("/get-checkitem").get(GetCheckList);
routes.route("/search-checkitem").get(searchCheckList);



export default routes