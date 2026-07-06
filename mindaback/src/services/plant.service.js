import { PlantModel } from "../models/plant.modal.js";
import { CompanyModel } from "../models/company.modal.js";
import { Op } from "sequelize";


export const plantCreateService = async (data) => {
    const result = await PlantModel.create(data);
    return result;
};

export const plantlistService = async (skip, limit) => {
    const result = await PlantModel.findAll({
        include: [{ model: CompanyModel, as: "company" }],
        offset: skip,
        limit,
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const plantUpdateService = async (id, data) => {
    const plant = await PlantModel.findByPk(id);
    if (!plant) return null;
    const result = await plant.update(data);
    return result;
};

export const plantDeleteService = async (id) => {
    const plant = await PlantModel.findByPk(id);
    if (!plant) return null;
    await plant.destroy();
    const result = plant;
    return result;
};

export const getPlantByIdService = async (id) => {
    const result = await PlantModel.findByPk(id, { include: [{ model: CompanyModel, as: "company" }] });
    return result;
};

export const plantSearchService = async (query = "", company, skip, limit) => {
    const q = query || "";
    const where = {
        ...(company ? { company_id: company } : {}),
        [Op.or]: [
            { plant_name: { [Op.like]: `%${q}%` } },
            { plant_address: { [Op.like]: `%${q}%` } },
        ],
    };
    const result = await PlantModel.findAll({
        where,
        include: [{ model: CompanyModel, as: "company" }],
        offset: skip,
        limit,
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const AllPlantDataService = async (companyId) => {
    const result = await PlantModel.findAll({
        where: { company_id: companyId },
        attributes: ["_id", "plant_name","plant_code"],
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const deleteManyPlantsByCompany = async (company_id) => {
    const result = await PlantModel.destroy({ where: { company_id } });
    return result;
};


export const AllPlantDataWithPageService = async () => {
    const result = await PlantModel.findAll({
        attributes: ["_id", "plant_name","plant_code"],
        order: [["createdAt", "ASC"]],
    });
    return result
};

export const getPlantById = async (id) => {
    const result = await PlantModel.findByPk(id);
    return result;
};











