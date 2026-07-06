import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const PartModal = sequelize.define(
    "Part",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        part_name: { type: DataTypes.STRING(255), allowNull: false },
        part_number: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        material_code: { type: DataTypes.STRING(100), allowNull: true },
        modal_name: { type: DataTypes.STRING(255), allowNull: true }
    },
    {
        tableName: "parts",
        timestamps: true,
        indexes: [{ fields: ["part_name", "part_number"] }],
    }
);

PartModal.prototype.toJSON = function () {
    return this.get({ plain: true });
};

