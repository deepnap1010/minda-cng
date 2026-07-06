import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const NotificationModal = sequelize.define(
    "Notification",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        reciverId: { type: DataTypes.UUID, allowNull: false },
        senderId: { type: DataTypes.UUID, allowNull: true },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "send",
            validate: {
                isIn: [["send", "recived", "view"]],
            },
        },
        type: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "checklist_error",
            validate: {
                isIn: [["checklist_error", "template_approval", "cng_stage_moved", "cng_reject", "cng_complete"]],
            },
        },
        template_id: { type: DataTypes.UUID, allowNull: true },
        template_name: { type: DataTypes.STRING(255), allowNull: true },
        assembly: { type: DataTypes.UUID, allowNull: true },
        process_id: { type: DataTypes.UUID, allowNull: true },
        checkList: { type: DataTypes.UUID, allowNull: true },
    },
    {
        tableName: "notifications",
        timestamps: true,
    }
);

NotificationModal.prototype.toJSON = function () {
    return this.get({ plain: true });
};








