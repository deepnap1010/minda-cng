import { GroupUsersModel } from "../models/groupUsers.model.js"
import { BadRequestError } from "../utils/errorHandler.js";

export const CreateGroupUsersService = async (data) => {
     const result = await GroupUsersModel.bulkCreate(data);
     return result;
};


export const GetGroupUsersService = async (id) => {
    const result = await GroupUsersModel.findAll({
        where:{relese_group_id:id}
    });
    return result;
};

export const deleteGroupUsersService = async (id) => {
    const result = await GroupUsersModel.destroy({where:{_id:id}});
    return result;
};

export const UpdateGroupUsersService = async (id,data) => {
    const result = await GroupUsersModel.findByPk(id);
    if(!result){
        throw new BadRequestError("Data not found","UpdateGroupUsersService()  method error")
    }

    await result.update(data);
    return result;
};


export const DeleteManyGroupUsersService = async (id) => {
    const result = await GroupUsersModel.destroy({
        where:{
            relese_group_id:id
        }
    });

    return result;
}







