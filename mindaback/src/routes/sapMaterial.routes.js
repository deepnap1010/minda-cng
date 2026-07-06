import { Router } from "express";
import {
  searchMaterials,
  getMaterial,
  getMaterialTypes,
  syncMaterials,
} from "../controller/sapMaterial.controller.js";

const routes = Router();

// Order matters: static paths before the param route.
routes.get("/material-types", getMaterialTypes);
routes.post("/materials/sync", syncMaterials);
routes.get("/materials", searchMaterials);
routes.get("/materials/:material", getMaterial);

export default routes;
