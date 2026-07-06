import { StatusCodes } from "http-status-codes";
import { createTypesService, deleteTypesService, getCatgoryTypeService, getCheckingMethodTypeService, getCheckingTimeTypeService, getTypesService, getUomTypeService, updatetypesService } from "../services/types.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errorHandler.js";


export const CreateTypes = AsyncHandler(async (req, res) => {
    const data = req.body;

    if (data?.uom) {
        const find = await getUomTypeService();
        if (find) {
            const result = await updatetypesService(find._id, { uom: data.uom });
            return res.status(StatusCodes.CREATED).json({
                message: "type created successfully",
                data: result
            });
        };
    };

    if (data?.checking_method) {
        const find = await getCheckingMethodTypeService();
        if (find) {
            const result = await updatetypesService(find._id, { checking_method: data.checking_method });
            return res.status(StatusCodes.CREATED).json({
                message: "type created successfully",
                data: result
            });
        };
    };


    if (data?.checking_time) {
        const find = await getCheckingTimeTypeService();
        if (find) {
            const result = await updatetypesService(find._id, { checking_time: data.checking_time });
            return res.status(StatusCodes.CREATED).json({
                message: "type created successfully",
                data: result
            });
        };
    };


    if (data?.category) {
        const find = await getCatgoryTypeService();
        if (find) {
            const result = await updatetypesService(find._id, { category: data.category });
            return res.status(StatusCodes.CREATED).json({
                message: "type created successfully",
                data: result
            });
        };
    };


    const result = await createTypesService(data);
    res.status(StatusCodes.CREATED).json({
        message: "type created successfully",
        data: result
    });
});


export const UpdateTypes = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;



    const result = await updatetypesService(id, data);
    if (!result) {
        throw new BadRequestError("data not found", "UpdateTypes() method error");
    };

    res.status(StatusCodes.OK).json({
        message: "Type updated Successfully",
        data: result
    });

});


export const DeleteTypes = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    if (data?.uom) {
        const result = await updatetypesService(id, { uom: "" });
        return res.status(StatusCodes.OK).json({
            message: "Type deleted Successfully",
            data: result
        });
    };

    if (data?.checking_time) {
        const result = await updatetypesService(id, { checking_time: "" });
        return res.status(StatusCodes.OK).json({
            message: "Type deleted Successfully",
            data: result
        });

    };

    if (data?.checking_method) {
        const result = await updatetypesService(id, { checking_method: "" });
        return res.status(StatusCodes.OK).json({
            message: "Type deleted Successfully",
            data: result
        });
    };

    const result = await deleteTypesService(id);
    if (!result) {
        throw new BadRequestError("data not found", "DeleteTypes() method error");
    };

    res.status(StatusCodes.OK).json({
        message: "Type deleted Successfully",
        data: result
    });

});


export const GetTypesData = AsyncHandler(async (req, res) => {
    const result = await getTypesService();
    res.status(StatusCodes.OK).json({
        data: result
    })
});












