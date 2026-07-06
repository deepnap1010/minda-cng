import { CompanyModel } from "../models/company.modal.js";
import { PlantModel } from "../models/plant.modal.js";
import { ProcessModel } from "../models/process.modal.js"
import { Op } from "sequelize";


export const createProcessService = async (data) => {
     const result = await ProcessModel.create(data);
     return result;
};

export const updateProcessService = async (id, data) => {
    const process = await ProcessModel.findByPk(id);
    if (!process) return null;
    const result = await process.update(data);
    return result;
};

export const deleteProcessService = async (id) => {
    const process = await ProcessModel.findByPk(id);
    if (!process) return null;
    await process.destroy();
    const result = process;
    return result;
};

export const getProcessServiceList = async (skip, limit) => {
    const result = await ProcessModel.findAll({
        order: [["createdAt", "ASC"]],
        include:[
            {model:CompanyModel,as:"company",attributes:["_id","company_name","company_address"]},
            {model:PlantModel,as:"plant",attributes:["_id","plant_name","plant_address","plant_code"]},
        ],
        offset: skip,
        limit,
    });
    return result;
};

export const searchProcessServiceList = async (search, skip, limit) => {
    const q = search || "";
    const result = await ProcessModel.findAll({
        where: {
            [Op.or]: [
                { process_name: { [Op.like]: `%${q}%` } },
                { process_no: { [Op.like]: `%${q}%` } },
            ],
        },
        order: [["createdAt", "ASC"]],
        include:[
            {model:CompanyModel,as:"company",attributes:["_id","company_name","company_address"]},
            {model:PlantModel,as:"plant",attributes:["_id","plant_name","plant_address"]},
        ],
        offset: skip,
        limit,
    });
    return result;
};

export const findProcessbyProcesNameOrNumber = async (name, number) => {
    const result = await ProcessModel.findOne({
        where: {
            [Op.or]: [
                { process_name: name, process_no: number },
                { process_no: number, process_name: name },
            ],
        },
    });
    return result;
};

export const allProcessService = async () => {
    const result = await ProcessModel.findAll({
        attributes: ["_id", "process_name", "process_no"],
        order: [["createdAt", "ASC"]],
    });
    return result;

}
