import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const CompanyModel = sequelize.define(
    "Company",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        company_name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        company_address: { type: DataTypes.STRING(500), allowNull: false },
        gst_no: { type: DataTypes.STRING(50), allowNull: true, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        company_code: { type: DataTypes.STRING(100), allowNull: true },
    },
    {
        tableName: "companies",
        timestamps: true,
        indexes: [
            { fields: ["company_name"] },
            { fields: ["company_address"] },
        ],
    }
);

CompanyModel.prototype.toJSON = function () {
    return this.get({ plain: true });
};


