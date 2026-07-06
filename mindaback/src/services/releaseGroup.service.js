import { ReleseGroupModel } from "../models/ReleseGroup.modal.js"
import { BadRequestError } from "../utils/errorHandler.js";

import { Op } from "sequelize";



export const createReleseGroup = async (data) => {
    const result = await ReleseGroupModel.create(data);
    return result;
};


export const getRelesGroup = async (search="",skip,limit) => {
    const result = await ReleseGroupModel.findAll({
        where:{
            [Op.or]:[{group_department:{[Op.like]:`%${search}%`}},{group_name:{[Op.like]:`%${search}%`}}]
        },
        offset:skip,
        limit
    });

    return result;
};

export const updateRelesGroup = async (id,data) => {
    const result = await ReleseGroupModel.findByPk(id);
    if(!result){
        throw new BadRequestError("Data Not Found","updateRelesGroup() method error");
    };
    await result.update(data);
    return result;
};

export const DeleteRelesGroup = async (id) => {
    const result = await ReleseGroupModel.destroy({
        where:{_id:id}
    });

    return result;
};


export const getReleaseGroupByNames = async (group_department,group_name) => {
    const result = await ReleseGroupModel.findOne({
        where:{
            [Op.or]:[{group_department},{group_name}]
        }
    });
    return result;
}

export const getAllReleaseGroups = async () => {
    const result = await ReleseGroupModel.findAll();
    return result;
};



