import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const QualityCheckModel = sequelize.define(
  "QualityCheck",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    machine_name: { type: DataTypes.STRING(255), allowNull: true },
    product_name: { type: DataTypes.STRING(255), allowNull: true },
    part_number: { type: DataTypes.STRING(255), allowNull: true },
    company_name: { type: DataTypes.STRING(255), allowNull: true },
    plant_name: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.STRING(50), allowNull: true }, // Pass, Fail, Pending
    remarks: { type: DataTypes.TEXT, allowNull: true },
    checked_by: { type: DataTypes.STRING(255), allowNull: true },
    checked_at: { type: DataTypes.DATE, allowNull: true },
    approve_quantity: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    reject_quantity: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "quality_check",
  }
);
