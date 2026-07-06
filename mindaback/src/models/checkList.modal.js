import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const CheckListModal = sequelize.define(
    "Checklist",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        item: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        check_list_method: { type: DataTypes.STRING(255), allowNull: false },
        check_list_time: { type: DataTypes.STRING(100), allowNull: false },
        result_type: { type: DataTypes.STRING(100), allowNull: false },
        min: { type: DataTypes.FLOAT, allowNull: true },
        max: { type: DataTypes.FLOAT, allowNull: true },
        uom: { type: DataTypes.STRING(50), allowNull: true },
        process: { type: DataTypes.UUID, allowNull: false },
        file_path: { type: DataTypes.STRING(500), allowNull: true },
        total_checks: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
        tableName: "checklists",
        timestamps: true,
        indexes: [{ fields: ["item", "process"] }],
    }
);

CheckListModal.prototype.toJSON = function () {
    return this.get({ plain: true });
};


