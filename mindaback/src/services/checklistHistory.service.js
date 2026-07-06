import { CheckListHistoryModal } from "../models/checkListHistory.modal.js"
import { AssemblyModal } from "../models/AssemblyLine.modal.js";
import { CheckListModal } from "../models/checkList.modal.js";
import { ProcessModel } from "../models/process.modal.js";
import { Op } from "sequelize";


export const createChecklistHistory = async (data) => {
  const result = await CheckListHistoryModal.bulkCreate(data);
  return result;
};

export const findTodayChecklistHistory = async (data) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return await CheckListHistoryModal.findAll({
    where: {
      createdAt: { [Op.between]: [startOfDay, endOfDay] },
      [Op.or]: data.map((item) => ({
        checkList: item.checkList,
        process_id: item.process_id,
        assembly: item.assembly,
      })),
    },
    attributes: ["checkList", "process_id", "assembly"],
    order: [["createdAt", "ASC"]],
  });
};

export const UpdateCheckListHistory = async (id, data) => {
  const history = await CheckListHistoryModal.findByPk(id);
  if (!history) return null;
  const result = await history.update(data);
  return result
};

export const GetAllErrorsHistory = async (startDate,endDate,admin, user) => {

  const today = new Date();

  const startOfDay =startDate ? new Date(startDate) : new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = endDate ?  new Date(endDate) : new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  const where = admin
    ? { is_error: true, createdAt: { [Op.between]: [startOfDay, endOfDay] } }
    : { user_id: user, is_error: true, createdAt: { [Op.between]: [startOfDay, endOfDay] } };

  const result = await CheckListHistoryModal.findAll({
    where,
    include: [
      { model: CheckListModal, as: "checklistItem" },
      { model: AssemblyModal, as: "assemblyLine" },
      { model: ProcessModel, as: "processInfo" },
    ],
    order: [["createdAt", "ASC"]],
  });
  return result;
};

















