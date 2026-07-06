import { CheckListModal } from "../models/checkList.modal.js"
import { ItemCheckTimeModel } from "../models/itemCheckTime.model.js";
import { ProcessModel } from "../models/process.modal.js";
import { Op } from "sequelize";


export const createChecklistService = async (data) => {
    const result = await CheckListModal.create(data);
    return result;
};

export const updateChecklistService = async (id,data) => {
    const checklist = await CheckListModal.findByPk(id);
    if (!checklist) return null;
    const result = await checklist.update(data);
    return result;
};

export const DeleteCheckListService = async (id) => {
    const checklist = await CheckListModal.findByPk(id);
    if (!checklist) return null;
    await checklist.destroy();
    const result = checklist;
    return result;
};

export const getCheckListDataService = async (skip,limit) => {
        const result = await CheckListModal.findAll({
            include: [
                { model: ProcessModel, as: "processInfo", attributes: ["_id", "process_name", "process_no"] },
                {model:ItemCheckTimeModel,as:"time" }
            ],
            order: [["createdAt", "ASC"]],
            offset: skip,
            limit,
        });
        return result;
   
};

export const SearchCheckListDataService = async (search="",process="",skip,limit) => {
    const q = search || "";
    const result = await CheckListModal.findAll({
        where: {
            ...(process ? { process } : {}),
            item: { [Op.like]: `%${q}%` },
        },
        include: [{ model: ProcessModel, as: "processInfo", attributes: ["_id", "process_name", "process_no"] }],
        order: [["createdAt", "ASC"]],
        offset: skip,
        limit,
    });
    return result;
};

export const FindChecklistByName = async (name) => {
    const result = await CheckListModal.findOne({ where: { item: name } });
    return result;
};


export const FindCheckListById  = async (id) => {
    const result = await CheckListModal.findByPk(id);
    return result;
}
