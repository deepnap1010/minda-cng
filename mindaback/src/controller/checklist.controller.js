import { StatusCodes } from "http-status-codes";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ------------------------ local imports ---------------------------------
import { createChecklistService, DeleteCheckListService, FindCheckListById, getCheckListDataService, SearchCheckListDataService, updateChecklistService } from "../services/Checklist.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError } from "../utils/errorHandler.js";
import { config } from "../config.js";
import { createChecklistItemTimeService, DeleteManyCheckListsItemService } from "../services/checkItemTime.service.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const CreateChecklistData = AsyncHandler(async (req, res) => {

    const data = req.body;
    const file = req.file;

    // if (!file) {
    //     throw new NotFoundError("file is required", "CreateChecklistData() method error");
    // }

    const file_path = file ? `${config.NODE_ENV !== "development" ? config.SERVER_URL : config.LOCAL_SERVER_URL}/files/${file.filename}` : null;
    const parsTime = data?.time && Array.isArray(data?.time) ? data?.time : [data?.time];


    const result = await createChecklistService(file_path ? { ...data, file_path, total_checks: parsTime?.length || 0 } : { ...data, total_checks: parsTime?.length || 0 });

    if (data?.time) {
        const mapData = parsTime?.map((timeItem) => ({ check_time: timeItem, item_id: result._id }));
        await createChecklistItemTimeService(mapData);
    }

    res.status(StatusCodes.CREATED).json({
        message: "Item Created Successfully",
        data: result
    });

});

export const UpdateCheckListData = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const file = req.file;




    const times = Array.isArray(data?.time)
        ? data.time
        : data?.time
            ? [data.time]
            : [];

    const file_path = file
        ? `${config.NODE_ENV !== "development" ? config.SERVER_URL : config.LOCAL_SERVER_URL}/files/${file.filename}`
        : null;

    const exist = await FindCheckListById(id);
    if (!exist) {
        throw new NotFoundError("Item not found", "UpdateCheckListData() method error");
    }


    if (file && exist.file_path) {
        fs.unlinkSync(
            path.join(
                __dirname,
                `../../public/temp/${exist.file_path.split("/files/")[1]}`
            )
        );
    }


    const updatePayload = {
        ...data,
        ...(file_path && { file_path }),
        total_checks: times.length,
    };

    delete updatePayload.time;

    const result = await updateChecklistService(id, updatePayload);

    if (!result) {
        throw new NotFoundError("Item not found", "UpdateCheckListData() method error");
    }

    res.status(StatusCodes.OK).json({
        message: "Check Item Updated Successfully",
        result,
    });


    if (times.length > 0) {
        await DeleteManyCheckListsItemService(result._id);

        const mapData = times.map((t) => ({
            item_id: result._id,
            check_time: `${t}:00`,
        }));

        await createChecklistItemTimeService(mapData);
    }
});


export const DeleteCheckList = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await DeleteCheckListService(id);
    if (!result) {
        throw new NotFoundError("Item not found", "UpdateCheckListData() method error")
    }

    fs.unlinkSync(path.join(__dirname, `../../public/temp/${result.file_path?.split("/files/")[1]}`));
    res.status(StatusCodes.OK).json({
        message: "Check Item Updated Successfully",
        result
    })
});

export const GetCheckList = AsyncHandler(async (req, res) => {
    let { limit, page } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const result = await getCheckListDataService(skip, limit);
    res.status(StatusCodes.OK).json({
        data: result
    });
});

export const searchCheckList = AsyncHandler(async (req, res) => {
    let { search, process, limit, page } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const result = await SearchCheckListDataService(search?.trim(), process?.trim(), skip, limit);
    res.status(StatusCodes.OK).json({
        data: result
    });
});






