import { TypeModal } from "../models/types.modal.js"
import { Op } from "sequelize";


export const createTypesService = async (data) =>{
    const result = await TypeModal.create(data);
    return result;
};

export const updatetypesService = async (id,data) => {
    const type = await TypeModal.findByPk(id);
    if (!type) return null;
    const result = await type.update(data);
    return result;
};

export const deleteTypesService = async (id) => {
    const type = await TypeModal.findByPk(id);
    if (!type) return null;
    await type.destroy();
    const result = type;
    return result;
};

export const getTypesService = async () => {
    const result = await TypeModal.findAll({ order: [["createdAt", "ASC"]] });
    return result;
};

export const getUomTypeService = async () => {
    const result = await TypeModal.findOne({
        where: { [Op.or]: [{ uom: null }, { uom: "" }] },
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const getCheckingTimeTypeService = async () => {
    const result = await TypeModal.findOne({
        where: { [Op.or]: [{ checking_time: null }, { checking_time: "" }] },
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const getCheckingMethodTypeService = async () => {
    const result = await TypeModal.findOne({
        where: { [Op.or]: [{ checking_method: null }, { checking_method: "" }] },
        order: [["createdAt", "ASC"]],
    });
    return result;
};


export const getCatgoryTypeService = async () => {
      const result = await TypeModal.findOne({
        where: { [Op.or]: [{ category: null }, { category: "" }] },
        order: [["createdAt", "ASC"]],
    });
    return result;
}








