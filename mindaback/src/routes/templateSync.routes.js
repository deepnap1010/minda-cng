import { Router } from "express";
import {
  pullTemplateSync,
  templateSyncPendingCount,
} from "../controller/templateSync.controller.js";

const routes = Router();

// Both routes are protected by the sapSyncApiKey middleware (mounted in routes.js).
routes.get("/templates/pending-count", templateSyncPendingCount);
routes.get("/templates", pullTemplateSync);

export default routes;
