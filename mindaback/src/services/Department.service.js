import { DepartmentModel } from "../models/department.modal.js";
import { Op } from "sequelize";



export const CreateDepartmentService = async (data) => {
    const result = await DepartmentModel.create(data);
    return result;
};


export const GetAllDepartmentsService = async (search="",skip, limit) => {
    const result = await DepartmentModel.findAll({
        where : {
            name: { [Op.like]: `%${search}%` }
        },
        order: [["createdAt", "ASC"]],
        offset: skip,
        limit,
    });
    return result;
};

export const UpdateDepartmentService = async (id, data) => {
    const result = await DepartmentModel.update(data, { where: { _id: id } });
    return result;
};


export const DeleteDepartmentService = async (id) => {
  const result = await DepartmentModel.destroy({ where: { _id: id } });
  return result;
};

export const GetAllDepartmentWithoutPagination = async () => {
    const result = await DepartmentModel.findAll({
        attributes: ["_id", "name"],
        order: [["createdAt", "ASC"]],
    });
    return result;
};


export const getDipartmentByName = async (name) => {
    const result = await DepartmentModel.findOne({ where: { name } });
    return result;
}

export const getDepartmentById = async (id) => {
    const result = await DepartmentModel.findOne({ where: { _id: id } });
    return result;
}








