import { io } from "../server.js"

/** Emit so frontend refetches notifications (header bell). */
export const sendNotification = (notification) => {
    io.emit("notification", { type: "new_notification", data: notification });
};

export const sendNewNotification = (notificationData) => {
    io.emit("notification", { type: "new_notification", data: notificationData });
};



