import { RoleModel } from "../models/role.modal.js"
import { Op } from "sequelize";



export const createRoleService = async (data) => {
    const result = await RoleModel.create(data);
    return result;
};

export const getRolesListService = async (skip,limit) => {
    const result = await RoleModel.findAll({
        order: [["createdAt", "ASC"]],
        offset: skip,
        limit,
    });
    return result;
};

export const updateRoleService = async (id,data) => {
    const role = await RoleModel.findByPk(id);
    if (!role) return null;
    const result = await role.update(data);
    return result;
};

export const deleteRoleService = async (id) => {
    const role = await RoleModel.findByPk(id);
    if (!role) return null;
    await role.destroy();
    const result = role;
    return result;
};

export const findRoleBuName = async (name) => {
    const result = await RoleModel.findOne({ where: { name } });
    return result;
};

export const searchRoleByName = async (name,skip,limit) => {
    const q = name || "";
    const result = await RoleModel.findAll({
        where: { name: { [Op.like]: `%${q}%` } },
        order: [["createdAt", "ASC"]],
        offset: skip,
        limit,
    });
    return result;
}

export const getAllRoleService = async () => {
    const result = await RoleModel.findAll({
        attributes: ["_id", "name"],
        order: [["createdAt", "ASC"]],
    });
    return result;
}





