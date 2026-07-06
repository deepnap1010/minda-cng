import { CompanyModel } from "../models/company.modal.js"
import { Op } from "sequelize";


export const companyCreateService = async (data) => {
    const result = await CompanyModel.create(data);
    return result;
};


export const companyListService = async (skip, limit) => {
        const result = await CompanyModel.findAll({
            order: [["createdAt", "ASC"]],
            offset: skip,
            limit,
        });
        return result;
};

export const companyDeleteService = async (id) => {
    const company = await CompanyModel.findByPk(id);
    if (!company) return null;
    await company.destroy();
    const result = company;
    return result;
};

export const comanyUpdateService = async (id, data) => {
    const company = await CompanyModel.findByPk(id);
    if (!company) return null;
    const result = await company.update(data);
    return result;
};

export const FindCompanyByName = async (company_name,gst_no) => {
    const result = await CompanyModel.findOne({
        where: {
            [Op.or]: [
                company_name ? { company_name } : null,
                gst_no ? { gst_no } : null,
            ].filter(Boolean),
        },
    });
    return result;
};

export const GetAllSearchItems = async (search, skip, limit) => {
    const q = search || "";
    const result = await CompanyModel.findAll({
        where: {
            [Op.or]: [
                { company_name: { [Op.like]: `%${q}%` } },
                { company_address: { [Op.like]: `%${q}%` } },
            ],
        },
        offset: skip,
        limit,
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const getAllCompanyesData = async () => {
    const result = await CompanyModel.findAll({
        attributes: ["_id", "company_name"],
        order: [["createdAt", "ASC"]],
    });
    return result
}






