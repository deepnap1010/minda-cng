import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

// status per assigned user: pending, in-progress, re-assign, completed, rejected
export const ASSIGNED_USER_STATUS_ENUM = ["pending", "in-progress", "re-assign", "completed", "rejected"];

function normalizeAssignedItem(item) {
  if (item && typeof item === "object" && (item.user_id != null || item._id != null)) {
    const uid = item.user_id ?? item._id;
    const st = item.status;
    return {
      user_id: String(uid),
      status: ASSIGNED_USER_STATUS_ENUM.includes(st) ? st : "pending",
    };
  }
  if (typeof item === "string" && item) {
    return { user_id: String(item), status: "pending" };
  }
  return null;
}

export const TemplateMasterModel = sequelize.define(
  "TemplateMaster",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    template_name: { type: DataTypes.STRING, allowNull: false, unique: true },
    template_type: { type: DataTypes.STRING, allowNull: true }, // NEW / AMENDMENT (optional)
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    assigned_user: { type: DataTypes.UUID, allowNull: true }, // backward compat: first assigned user id
    assigned_users: {
      type: DataTypes.TEXT,
      allowNull: true,
      // Array of { user_id, status }. status: pending|in-progress|re-assign|completed|rejected
      get() {
        const value = this.getDataValue("assigned_users");
        if (!value) return [];
        try {
          const arr = JSON.parse(value);
          if (!Array.isArray(arr)) return [];
          return arr
            .map((item) => normalizeAssignedItem(item))
            .filter(Boolean);
        } catch {
          return [];
        }
      },
      set(value) {
        if (value === null || value === undefined) {
          this.setDataValue("assigned_users", null);
        } else if (Array.isArray(value) && value.length > 0) {
          const normalized = value
            .map((item) => normalizeAssignedItem(item))
            .filter(Boolean);
          this.setDataValue("assigned_users", normalized.length ? JSON.stringify(normalized) : null);
        } else if (Array.isArray(value) && value.length === 0) {
          this.setDataValue("assigned_users", null);
        } else {
          const n = normalizeAssignedItem(value);
          this.setDataValue("assigned_users", n ? JSON.stringify([n]) : null);
        }
      },
    },
    workflow_id: { type: DataTypes.UUID, allowNull: true },
  },
  {
    timestamps: true,
    tableName: "template_masters",
  }
);

