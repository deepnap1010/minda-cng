import { PlcProductModel } from "../models/plcProduct.model.js";
import { NotFoundError } from "../utils/errorHandler.js";
import { Op } from "sequelize";

export const createPlcProductService = async (data) => {
  const product = await PlcProductModel.create({
    material_code: data.material_code || null,
    material_description: data.material_description || null,
    part_no: data.part_no || null,
    model_code: data.model_code || null,
    machine_name: data.machine_name || null,
    company_name: data.company_name || null,
    plant_name: data.plant_name || null,
    product_name: data.product_name || null,
    approve_quantity: data.approve_quantity ?? 0,
    reject_quantity: data.reject_quantity ?? 0,
  });

  return product;
};

export const getAllPlcProductsService = async (filters = {}) => {
  const where = {};

  if (filters.machine_name && filters.machine_name.trim()) {
    where.machine_name = filters.machine_name.trim();
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    where[Op.or] = [
      { material_code: { [Op.like]: searchTerm } },
      { material_description: { [Op.like]: searchTerm } },
      { part_no: { [Op.like]: searchTerm } },
      { model_code: { [Op.like]: searchTerm } },
      { machine_name: { [Op.like]: searchTerm } },
      { company_name: { [Op.like]: searchTerm } },
      { plant_name: { [Op.like]: searchTerm } },
      { product_name: { [Op.like]: searchTerm } },
    ];
  }

  const products = await PlcProductModel.findAll({
    where,
    order: [["created_at", "DESC"]],
  });

  return products;
};

export const getPlcProductByIdService = async (id) => {
  const product = await PlcProductModel.findByPk(id);
  if (!product) {
    throw new NotFoundError("PLC Product not found", "getPlcProductByIdService()");
  }
  return product;
};

export const updatePlcProductService = async (id, data) => {
  const product = await PlcProductModel.findByPk(id);
  if (!product) {
    throw new NotFoundError("PLC Product not found", "updatePlcProductService()");
  }

  const updateData = {};
  if (data.material_code !== undefined) updateData.material_code = data.material_code;
  if (data.material_description !== undefined) updateData.material_description = data.material_description;
  if (data.part_no !== undefined) updateData.part_no = data.part_no;
  if (data.model_code !== undefined) updateData.model_code = data.model_code;
  if (data.machine_name !== undefined) updateData.machine_name = data.machine_name;
  if (data.company_name !== undefined) updateData.company_name = data.company_name;
  if (data.plant_name !== undefined) updateData.plant_name = data.plant_name;
  if (data.product_name !== undefined) updateData.product_name = data.product_name;
  if (data.approve_quantity !== undefined) updateData.approve_quantity = data.approve_quantity;
  if (data.reject_quantity !== undefined) updateData.reject_quantity = data.reject_quantity;

  await product.update(updateData);
  return product;
};

export const deletePlcProductService = async (id) => {
  const product = await PlcProductModel.findByPk(id);
  if (!product) {
    throw new NotFoundError("PLC Product not found", "deletePlcProductService()");
  }

  await product.destroy();
  return true;
};
