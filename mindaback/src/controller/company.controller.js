import { StatusCodes } from "http-status-codes";

// ------------------  local imports -------------------
import { comanyUpdateService, companyCreateService, companyDeleteService, companyListService, FindCompanyByName, getAllCompanyesData, GetAllSearchItems } from "../services/company.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js"
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
import { deleteManyPlantsByCompany } from "../services/plant.service.js";



export const createCompany = AsyncHandler(async (req, res) => {
    const data = req.body;

    const exist = await FindCompanyByName(data?.company_name,data?.gst_no);
    if (exist) {
        throw new BadRequestError("Company name or PAN number  already exists", "createCompany() method error");
    }

    const result = await companyCreateService(data);
    return res.status(201).json({
        message: "Company created successfully",
        data: result
    });
});

export const listCompany = AsyncHandler(async (req, res) => {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const result = await companyListService(skip, limit);

    return res.status(200).json({
        message: "Company list fetched successfully",
        data: result
    });
});

export const updateCompany = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const result = await comanyUpdateService(id, data);
    if (!result) {
        throw new NotFoundError("Company not found", "updateCompany() methed error")
    }
    res.status(StatusCodes.OK).json({
        message: "Company updated successfully",
        data: result
    });
});

export const deleteCompany = AsyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await companyDeleteService(id);
    if (!result) {
        throw new NotFoundError("Company not found", "deleteCompany() methed error")
    }
    res.status(StatusCodes.OK).json({
        message: "Company deleted successfully",
        data: result
    });

    await deleteManyPlantsByCompany(id);
});

export const searchCompany = AsyncHandler(async (req,res) => {
    let {search,page,limit} = req.query; 
    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;
    const skip = (page - 1) * limit;
    const result = await GetAllSearchItems(search?.trim(),skip,limit);
    res.status(200).json({
        message: "plant search fetched successfully",
        data: result,
    });
});

export const AllCompaniesData = AsyncHandler(async (req,res) => {
    const result = await getAllCompanyesData();
    res.status(StatusCodes.OK).json({
        data:result
    });
})









