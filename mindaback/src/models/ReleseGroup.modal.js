import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const ReleseGroupModel = sequelize.define('Relesegroup', {
    _id: { type: DataTypes.UUID, defaultValue: Sequelize.literal("NEWID()"), primaryKey: true },
    group_name: { type: DataTypes.STRING, allowNull: false },
    group_department: { type: DataTypes.STRING, allowNull: false },
},
    {
        timestamps: true,
        tableName: "relesegroups",
        indexes: [
            { unique: true, fields: ["group_name", "group_department"] }
        ]
    })