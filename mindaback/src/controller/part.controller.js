import { StatusCodes } from "http-status-codes";
import { createPartsService, DeletePartService, FindPartServiceByName, GetAllPartsService, getPartsServiceData, UpdatePartService } from "../services/part.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";


export const CreateParts = AsyncHandler(async (req, res) => {
    const data = req.body;
    const exist = await FindPartServiceByName(data)
    if (exist) {
        throw new BadRequestError("Part already exist", "CreateParts() method error")
    };
    const result = await createPartsService(data);
    res.status(StatusCodes.CREATED).json({
        message: "Part created Successfully",
        data: result
    });
});

export const UpdateParts = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const exist = await FindPartServiceByName(data)
    if (!exist) {
        throw new BadRequestError("Part not Found", "CreateParts() method error")
    };
    const result = await UpdatePartService(id, data);
    if (!result) {
        throw new NotFoundError("Parts not found", "UpdateParts() method error");
    };

    res.status(StatusCodes.OK).json({
        message: "Part Updated Successfully",
        data: result
    });
});

export const DeleteParts = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await DeletePartService(id);
    if (!result) {
        throw new NotFoundError("Parts not found", "DeleteParts() method error");
    };

    res.status(StatusCodes.OK).json({
        message: "Part Deleted Successfully",
        data: result
    })

});

export const GetAllParts = AsyncHandler(async (req, res) => {
    const result = await GetAllPartsService();
    res.status(StatusCodes.OK).json({
        data: result
    })
});

export const GetAllpartsdata = AsyncHandler(async (req,res) => {
    let {search,page,limit} = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page -1) * limit;
    const data = await getPartsServiceData(search?.trim(),skip,limit);
    res.status(StatusCodes.OK).json({
        data
    })
});

