import {Router} from "express";
import { Validater } from "../middleware/validator.js";
import { documentValidationSchema } from "../validation/document.validation.js";
import { createDocument, deleteDocument, getDocument, updateDocument } from "../controller/document.controller.js";
import { upload } from "../config/multer.config.js";

const routes = Router();

routes.route("/create").post(upload.single("attached_doc"),Validater(documentValidationSchema),createDocument);
routes.route("/get").get(getDocument);
routes.route("/delete/id/:id").delete(deleteDocument);
routes.route('/update/id/:id').put(upload.single("attached_doc"),updateDocument)


export default routes;












