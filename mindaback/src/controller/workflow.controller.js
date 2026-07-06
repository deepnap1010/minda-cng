import { StatusCodes } from "http-status-codes";
import {
  createWorkflow,
  getWorkflowList,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  searchWorkflow,
} from "../services/workflow.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
import { ReleseGroupModel } from "../models/ReleseGroup.modal.js";
import { Op } from "sequelize";

export const createWorkflowController = AsyncHandler(async (req, res) => {
  const data = req.body;

  // Validate workflow array
  if (!data.workflow || !Array.isArray(data.workflow) || data.workflow.length === 0) {
    throw new BadRequestError("Workflow array is required with at least one group", "createWorkflowController() method error");
  }

  // Validate that all groups exist (excluding HOD which is a special value)
  const groupIds = data.workflow
    .map((item) => item.group)
    .filter(Boolean)
    .filter((id) => id !== "HOD"); // Exclude HOD from validation
    
  if (groupIds.length > 0) {
    const groups = await ReleseGroupModel.findAll({
      where: { _id: { [Op.in]: groupIds } },
    });
    if (groups.length !== groupIds.length) {
      throw new BadRequestError("One or more release groups not found", "createWorkflowController() method error");
    }
  }

  const result = await createWorkflow(data);
  return res.status(StatusCodes.CREATED).json({
    message: "Workflow created successfully",
    data: result,
  });
});

export const getWorkflowListController = AsyncHandler(async (req, res) => {
  let { page, limit } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const result = await getWorkflowList(skip, limit);
  return res.status(StatusCodes.OK).json({
    message: "Workflow list fetched successfully",
    data: result,
  });
});

export const getWorkflowByIdController = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getWorkflowById(id);
  if (!result) {
    throw new NotFoundError("Workflow not found", "getWorkflowByIdController() method error");
  }
  return res.status(StatusCodes.OK).json({
    message: "Workflow fetched successfully",
    data: result,
  });
});

export const updateWorkflowController = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  // Validate workflow array
  if (!data.workflow || !Array.isArray(data.workflow) || data.workflow.length === 0) {
    throw new BadRequestError("Workflow array is required with at least one group", "updateWorkflowController() method error");
  }

  // Validate that all groups exist (excluding HOD which is a special value)
  const groupIds = data.workflow
    .map((item) => item.group)
    .filter(Boolean)
    .filter((id) => id !== "HOD"); // Exclude HOD from validation
    
  if (groupIds.length > 0) {
    const groups = await ReleseGroupModel.findAll({
      where: { _id: { [Op.in]: groupIds } },
    });
    if (groups.length !== groupIds.length) {
      throw new BadRequestError("One or more release groups not found", "updateWorkflowController() method error");
    }
  }

  const result = await updateWorkflow(id, data);
  return res.status(StatusCodes.OK).json({
    message: "Workflow updated successfully",
    data: result,
  });
});

export const deleteWorkflowController = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteWorkflow(id);
  if (!result) {
    throw new NotFoundError("Workflow not found", "deleteWorkflowController() method error");
  }
  return res.status(StatusCodes.OK).json({
    message: "Workflow deleted successfully",
  });
});

export const searchWorkflowController = AsyncHandler(async (req, res) => {
  let { search, page, limit } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const result = await searchWorkflow(search?.trim() || "", skip, limit);
  return res.status(StatusCodes.OK).json({
    message: "Workflow search completed successfully",
    data: result,
  });
});


