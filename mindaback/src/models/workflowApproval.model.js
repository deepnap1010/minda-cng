import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const WorkflowApprovalModel = sequelize.define(
  "WorkflowApproval",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    current_stage: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reassign_stage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    workflow_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "workflows",
        key: "_id",
      },
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [["approved", "rejected", "reassigned"]],
      },
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "_id",
      },
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "template_masters",
        key: "_id",
      },
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "_id",
      },
    },
    reassign_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "_id",
      },
    },
    reassign_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    edit_count:{
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    submission_id:{
      type: DataTypes.UUID,
      allowNull:false,
    }
  },
  {
    timestamps: true,
    tableName: "workflow_approvals",
    indexes: [
      { fields: ["workflow_id"] },
      { fields: ["template_id"] },
      { fields: ["user_id"] },
      { fields: ["status"] },
      { fields: ["template_id", "current_stage"] },
    ],
  }
);
