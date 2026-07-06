import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const TypeModal = sequelize.define(
    "Type",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        uom: { type: DataTypes.STRING(100), allowNull: true },
        checking_time: { type: DataTypes.STRING(100), allowNull: true },
        checking_method: { type: DataTypes.STRING(255), allowNull: true },
        category:{type:DataTypes.STRING(255),allowNull:true}
    },
    {
        tableName: "types",
        timestamps: true,
    }
);

TypeModal.prototype.toJSON = function () {
    return this.get({ plain: true });
};

