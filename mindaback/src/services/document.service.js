import { Op } from "sequelize";
import { DocumentModel } from "../models/Document.model.js"
import { NotFoundError } from "../utils/errorHandler.js";


export const createDocumentService = async (data) => {
    const result = await DocumentModel.create(data);
    return result;
};

export const getDocumentService = async (search="",skip, limit) => {
    const result = await DocumentModel.findAll({
        where:{
            doc_name:{[Op.like]:`%${search}%`}
        },
        offset: skip,
        limit,
        order: [["createdAt", "ASC"]],
    });
    const total = await DocumentModel.count();
    return {data:result,total_pages:Math.ceil(total/limit),total_data:total};
};

export const updateDocumentService = async (id,data) =>{
    const result = await DocumentModel.findByPk(id);
    if(!result){
        throw new NotFoundError("document not found","updateDocumentService() method error")
    }
    await result.update(data);
    return result;
};

export const deleteDocumentService = async (id) => {
    const result = await DocumentModel.destroy({
        where:{
            _id:id
        },
    });
    return result;
};


export const findDocumentById = async (id) => {
    const result = await DocumentModel.findByPk(id);
    return result;
};







