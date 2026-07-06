import {Router} from "express";

// ------------------  local imports -------------------
import { AllCompaniesData, createCompany, deleteCompany, listCompany, searchCompany, updateCompany } from "../controller/company.controller.js";
import { Validater } from "../middleware/validator.js";
import { companyValidationSchema } from "../validation/company.validation.js";

const routes = Router();


routes.route("/create-company").post(Validater(companyValidationSchema),createCompany);
routes.route("/list-company").get(listCompany);
routes.route("/update-company/:id").put(updateCompany);
routes.route("/delete-company/:id").delete(deleteCompany);
routes.route("/search-company").get(searchCompany);
routes.route("/all-companies").get(AllCompaniesData)


export default routes;


