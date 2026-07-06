import { Router } from "express";
import { getNotificationData, ReadAllNotification, UpdateNotificationData } from "../controller/notification.controller.js";


const routes = Router();

routes.route("/get-notifications").get(getNotificationData);
routes.route("/update-notification/:id").put(UpdateNotificationData);
routes.route("/mark-all-notification").put(ReadAllNotification)


export default routes;