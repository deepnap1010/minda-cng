import { AsyncHandler } from "../utils/asyncHandler.js";
import { CreateDepartmentService, DeleteDepartmentService, GetAllDepartmentsService, GetAllDepartmentWithoutPagination, getDipartmentByName, UpdateDepartmentService } from "../services/Department.service.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../utils/errorHandler.js";


export const CreateDepartment = AsyncHandler(async (req, res) => {
    const data = req.body;

    const exist = await getDipartmentByName(data.name);
    if (exist) {
        throw new NotFoundError("Department already exist", "CreateDepartment() method error");
    }

    const result = await CreateDepartmentService(data);
    res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Department created successfully",
        data: result
    });
});


export const GetAllDepartments = AsyncHandler(async (req, res) => {
    let { page, limit,search } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const result = await GetAllDepartmentsService(search,skip, limit);
    res.status(StatusCodes.OK).json({
        success: true,
        data: result
    });
});


export const UpdateDepartment = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const result = await UpdateDepartmentService(id, data);
    if (!result) {
        throw new NotFoundError("Department not found");
    }
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Department updated successfully",
        data: result
    });
});


export const DeleteDepartment = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await DeleteDepartmentService(id);
    if (!result) {
        throw new NotFoundError("Department not found");
    }
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Department deleted successfully",
    });
});


export const GetAllDepartmentData = AsyncHandler(async (req, res) => {
    const result = await GetAllDepartmentWithoutPagination();
    res.status(StatusCodes.OK).json({
        success: true,
        data: result
    });
});










