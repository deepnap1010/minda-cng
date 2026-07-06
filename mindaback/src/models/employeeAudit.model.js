import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

/**
 * Audit / history log for employee (user) records.
 * One row per action: created | updated | binned | restored | deleted.
 * `details` holds a JSON string (changed fields, snapshot, or a note).
 */
export const EmployeeAuditModel = sequelize.define(
  "EmployeeAudit",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    user_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    performed_by: { type: DataTypes.STRING(255), allowNull: true },
    performed_by_id: { type: DataTypes.UUID, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "employee_audit",
    timestamps: true,
    indexes: [{ fields: ["user_id"] }],
  }
);

EmployeeAuditModel.prototype.toJSON = function () {
  return this.get({ plain: true });
};