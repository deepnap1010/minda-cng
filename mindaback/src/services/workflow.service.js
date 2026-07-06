import { WorkflowModel } from "../models/workflow.modal.js";
import { BadRequestError } from "../utils/errorHandler.js";
import { Op } from "sequelize";

export const createWorkflow = async (data) => {
  const result = await WorkflowModel.create({
    name: data.name,
    workflow: data.workflow || [],
  });
  return result;
};

export const getWorkflowList = async (skip, limit) => {
  const result = await WorkflowModel.findAll({
    offset: skip,
    limit: limit,
    order: [["createdAt", "DESC"]],
  });
  return result;
};

export const getWorkflowById = async (id) => {
  const result = await WorkflowModel.findByPk(id);
  return result;
};

export const updateWorkflow = async (id, data) => {
  const result = await WorkflowModel.findByPk(id);
  if (!result) {
    throw new BadRequestError("Workflow not found", "updateWorkflow() method error");
  }
  await result.update({
    name: data.name,
    workflow: data.workflow || [],
  });
  return result;
};

export const deleteWorkflow = async (id) => {
  const result = await WorkflowModel.destroy({
    where: { _id: id },
  });
  return result;
};

export const searchWorkflow = async (search, skip, limit) => {
  const result = await WorkflowModel.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
      ],
    },
    offset: skip,
    limit: limit,
    order: [["createdAt", "DESC"]],
  });
  return result;
};



