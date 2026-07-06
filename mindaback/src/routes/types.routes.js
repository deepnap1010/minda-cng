import {Router} from "express";
import { CreateTypes, DeleteTypes, GetTypesData, UpdateTypes } from "../controller/types.controller.js";


const routes = Router();

routes.route("/create-types").post(CreateTypes);
routes.route("/update-types/:id").put(UpdateTypes);
routes.route("/delete-types/:id").delete(DeleteTypes);
routes.route("/get-types").get(GetTypesData);


export default routes;



