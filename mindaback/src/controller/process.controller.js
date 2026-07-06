import { StatusCodes } from "http-status-codes";
import { allProcessService, createProcessService, deleteProcessService, getProcessServiceList, searchProcessServiceList, updateProcessService } from "../services/process.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {  NotFoundError } from "../utils/errorHandler.js";





export const createProcess = AsyncHandler(async (req, res) => {
    const data = req.body;


    // const exist = await findProcessbyProcesNameOrNumber(data.process_name, data.process_no);
    // if (exist) {
    //     throw new BadRequestError("Process name or  Process number is already exist", "createProcess() method error");
    // }
    const result = await createProcessService(data);
    res.status(StatusCodes.OK).json({
        message: "Process created successfully",
        data: result
    });
});

export const getProcess = AsyncHandler(async (req, res) => {
    let { page, limit } = req.query;
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;
    const skip = (page - 1) * limit;
    const result = await getProcessServiceList(skip, limit);
    res.status(StatusCodes.OK).json({
        data: result
    })
});

export const getProcessbySearch = AsyncHandler(async (req, res) => {
    let { search, page, limit } = req.query;
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;
    const skip = (page - 1) * limit;
    const result = await searchProcessServiceList(search?.trim(), skip, limit);
    res.status(StatusCodes.OK).json({
        data: result
    })
});

export const deleteProcess = AsyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await deleteProcessService(id);
    if (!result) {
        throw new NotFoundError("Process not found", "deleteProcess() method error")
    };
    res.status(StatusCodes.OK).json({
        message: "Process deleted successfully",
        data: result
    })
});

export const updateProcess = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const result = await updateProcessService(id,data);
    if (!result) {
        throw new NotFoundError("Process not found", "updateProcess() method error")
    };
    res.status(StatusCodes.OK).json({
        message: "Process updated successfully",
        data: result
    })

});

export const getAllProcess = AsyncHandler(async (req,res) => {
    const result = await allProcessService();
    res.status(StatusCodes.OK).json({
        data:result
    })
});










