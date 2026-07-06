import { StatusCodes } from "http-status-codes";
import { GetNotification, GetUpdateAll, UpdateNotification } from "../services/notification.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError } from "../utils/errorHandler.js";
import { NotificationModal } from "../models/notification.modal.js";


export const getNotificationData = AsyncHandler(async (req, res) => {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const totalData = await NotificationModal.count({ where: { reciverId: req.currentUser?._id } });
    const result = await GetNotification(req.currentUser?._id, skip, limit);
    // console.log(result)
    res.status(StatusCodes.OK).json({
        data: result,
        totalPages: Math.ceil(totalData / limit),
    });
});


export const UpdateNotificationData = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const result = await UpdateNotification(id, data);
    if (!result) {
        throw new NotFoundError("data not found", "UpdateNotificationData() method error");
    };
    res.status(StatusCodes.OK).json({
        message: "Data Updated successfully",
        data: result
    });
});


export const ReadAllNotification = AsyncHandler(async (req, res) => {
    const data = req.body;
    const result = await GetUpdateAll(data.reciverId, data);
    if (!result) {
        throw new NotFoundError("data not found", "UpdateNotificationData() method error");
    };
    res.status(StatusCodes.OK).json({
        message: "Data Updated successfully",
        data: result
    });
});

















