import { StatusCodes } from "http-status-codes";
import { AllPlantDataService, AllPlantDataWithPageService, plantCreateService, plantDeleteService, plantlistService, plantSearchService, plantUpdateService } from "../services/plant.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError } from "../utils/errorHandler.js";


export const createPlant = AsyncHandler(async (req, res) => {
    const data = req.body;
    const result = await plantCreateService(data);
    res.status(201).json({
        message: "plant created successfully",
        data: result,
    });
});

export const listPlant = AsyncHandler(async (req, res) => {
    let { page, limit } = req.query;
    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;
    const skip = (page - 1) * limit;
    const result = await plantlistService(skip, parseInt(limit));
    res.status(200).json({
        message: "plant list fetched successfully",
        data: result,
    });
});

export const updatePlant = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const result = await plantUpdateService(id, data);
    if (!result) {
        throw new NotFoundError("data not found for update", "updatePlant() service");
    }
    res.status(200).json({
        message: "plant updated successfully",
        data: result,
    });
});

export const deletePlant = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await plantDeleteService(id);
    if (!result) {
        throw new NotFoundError("data not found for delete", "deletePlant() service");
    }
    res.status(200).json({
        message: "plant deleted successfully",
        data: result,
    });
});

export const searchPlant = AsyncHandler(async (req,res) => {
    let {company,search,page,limit} = req.query; 
    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;
    const skip = (page - 1) * limit;
    const result = await plantSearchService(search?.trim(),company?.trim() || company,skip,limit);
    res.status(200).json({
        message: "plant search fetched successfully",
        data: result,
    });
});

export const AllPlantData = AsyncHandler(async (req,res) => {
    const {id} = req.params;
    const result = await AllPlantDataService(id);
    res.status(StatusCodes.OK).json({
        data:result,
    });
});


export const GetAllPlantData = AsyncHandler(async (req,res) => {
    const result = await AllPlantDataWithPageService();
    res.status(StatusCodes.OK).json({
        data:result
    })
});








