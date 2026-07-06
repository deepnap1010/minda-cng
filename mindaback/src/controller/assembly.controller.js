import { StatusCodes } from "http-status-codes";
import { createAssemblyService, deleteAssemblyService, findAssemblyByName, getAllAssemblyDataService, getAllAssemblyService, getAllITemsToCheckTimeBases, getAssemblyLineByResponsibility, GetAssemblyLineDataReport, getAssemblyLineFormByResponsibility,  getAssemblyLineTodayReport,  searchAllAssemblyService, updateAssemblyService } from "../services/assembly.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";



export const createAssembly = AsyncHandler(async (req, res) => {
    const data = req.body;
    const exist = await findAssemblyByName(data.assembly_name);
    if (exist) {
        throw new BadRequestError("Assembly already created please check", "createAssembly() method error")
    }

    const result = await createAssemblyService(data);
    res.status(StatusCodes.CREATED).json({
        message: "Assembly Created Successfully",
        data: result
    })
});

export const getAssemblyData = AsyncHandler(async (req, res) => {
    let { limit, page } = req.query;
    const user = req.currentUser;
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;
    const skip = (page - 1) * limit;
    const data = await getAllAssemblyService(user?.is_admin,user?._id,skip, limit);
    res.status(StatusCodes.OK).json({
        data
    })
});

export const searchAssemblyData = AsyncHandler(async (req, res) => {
    let { part,process,user,plant,company,search, limit, page } = req.query;
    const userData = req.currentUser;
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;
    const skip = (page - 1) * limit;
    const data = await searchAllAssemblyService(userData?.is_admin,userData?._id,search?.trim(),part,process,user,plant,company, skip, limit);
    res.status(StatusCodes.OK).json({
        data
    })
});

export const deleteAssemblyData = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await deleteAssemblyService(id);
    if (!result) {
        throw new NotFoundError("Assembly not found", "deleteAssemblyData () method error");
    }

    res.status(StatusCodes.OK).json({
        message: "Assembly Line Deleted Successfully",
        data: result
    });
});

export const updateAssemblyData = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const result = await updateAssemblyService(id, data);
    if (!result) {
        throw new NotFoundError("Assembly not found", "updateAssemblyData() method error");
    }

    res.status(StatusCodes.OK).json({
        message: "Assembly Line updated Successfully",
        data: result
    });
});

export const getAllAssemblyData = AsyncHandler(async (req, res) => {
    const result = await getAllAssemblyDataService();
    res.status(StatusCodes.OK).json({
        data: result
    })
});

export const getAssemblyDataByResponsibal = AsyncHandler(async (req, res) => {
    const user = req.currentUser._id;
    const result = await getAssemblyLineByResponsibility(user);
    res.status(StatusCodes.OK).json({
        data: result
    });
});

export const assemblyLineFormResponsibal = AsyncHandler(async (req,res) => {
    const user = req.currentUser._id;
    const {assembly_id,process_id} = req.body;
    const result = await getAssemblyLineFormByResponsibility(user,assembly_id,process_id);
    res.status(StatusCodes.OK).json({
        data: result
    });
});

export const assemblyLineCardsData = AsyncHandler(async (req,res) => {
     const user = req.currentUser;
     const { start_date, end_date,company,plant } = req.query;
     const result = await GetAssemblyLineDataReport(user?.is_admin, user._id, start_date, end_date,company,plant);
     res.status(StatusCodes.OK).json({
        data: result
     });
});

export const assemblyLineDataTodayReport = AsyncHandler(async (req,res) => {
    let {page,limit,startdate,endDate} = req.query;
    const user = req.currentUser;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const result = await getAssemblyLineTodayReport(user?.is_admin,user._id,skip,limit,startdate,endDate);
    res.status(StatusCodes.OK).json({
        data:result
    })
});



export const getAllITemsToCheckTimeBase = AsyncHandler(async (req,res) => {
    const {assembly_id} = req.params;
     const user = req.currentUser;
    const result = await getAllITemsToCheckTimeBases(assembly_id,user._id);
    res.status(StatusCodes.OK).json({
        data:result
    })
});