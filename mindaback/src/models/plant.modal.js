import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const PlantModel = sequelize.define(
    "Plant",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        plant_name: { type: DataTypes.STRING(255), allowNull: false },
        plant_address: { type: DataTypes.STRING(500), allowNull: true },
        company_id: { type: DataTypes.UUID, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        plant_code: { type: DataTypes.STRING(100), allowNull: true },
        gst:{type:DataTypes.STRING(100),allowNull:true}
    },
    {
        tableName: "plants",
        timestamps: true,
        indexes: [{ fields: ["plant_name", "company_id"] }],
    }
);

PlantModel.prototype.toJSON = function () {
    return this.get({ plain: true });
};

