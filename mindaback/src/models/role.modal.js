import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const RoleModel = sequelize.define(
    "Role",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        permissions: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "[]",
            get() {
                const value = this.getDataValue("permissions");
                try {
                    return value ? JSON.parse(value) : [];
                } catch {
                    return [];
                }
            },
            set(value) {
                this.setDataValue("permissions", Array.isArray(value) ? JSON.stringify(value) : "[]");
            },
        },
    },
    {
        tableName: "roles",
        timestamps: true,
        indexes: [{ fields: ["name"] }],
    }
);

RoleModel.prototype.toJSON = function () {
    return this.get({ plain: true });
};


