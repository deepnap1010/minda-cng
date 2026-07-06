import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const WorkflowModel = sequelize.define(
  "Workflow",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    workflow: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const value = this.getDataValue("workflow");
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue("workflow", JSON.stringify(value));
      },
    },
  },
  {
    timestamps: true,
    tableName: "workflows",
    indexes: [{ fields: ["name"] }],
  }
);
