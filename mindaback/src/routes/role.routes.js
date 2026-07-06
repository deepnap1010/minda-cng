import {Router} from "express";

// ------------------------- local imports --------------------------------
import { createRole, DeleteRoleList, getAllRoleData, getRolesList, searchRoleData, updateRoleList } from "../controller/role.controller.js";
import { Validater } from "../middleware/validator.js";
import { roleValidationSchema } from "../validation/roles.validation.js";

const routes = Router();

routes.route("/create-roles").post(Validater(roleValidationSchema),createRole);
routes.route("/get-list-roles").get(getRolesList);
routes.route("/update-roles/:id").put(Validater(roleValidationSchema),updateRoleList);
routes.route("/delete-roles/:id").delete(DeleteRoleList);
routes.route("/search-roles").get(searchRoleData);
routes.route("/all-roles-data").get(getAllRoleData)


export default routes;