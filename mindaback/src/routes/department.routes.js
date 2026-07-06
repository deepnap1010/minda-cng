import { Router } from "express";
import { CreateDepartment, DeleteDepartment, GetAllDepartmentData, GetAllDepartments, UpdateDepartment } from "../controller/department.controller.js";
import { Validater } from "../middleware/validator.js";
import { DepartmentSchema } from "../validation/department.validation.js";



const router = Router();

router.post("/create", Validater(DepartmentSchema), CreateDepartment);
router.get("/all", GetAllDepartments);
router.put("/update/id/:id", UpdateDepartment);
router.delete("/delete/id/:id", DeleteDepartment);
router.get("/data", GetAllDepartmentData);

export default router;








