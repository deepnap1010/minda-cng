import bcrypt from "bcrypt"
import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const UserModel = sequelize.define(
    "User",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        full_name: { type: DataTypes.STRING(255), allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password: { type: DataTypes.STRING(255), allowNull: false },
        desigination: { type: DataTypes.STRING(255), allowNull: true },
        user_id: { type: DataTypes.STRING(50), allowNull: true, unique: true },
        employee_plant: { type: DataTypes.UUID, allowNull: true },
        employee_company: { type: DataTypes.UUID, allowNull: true },
        role: { type: DataTypes.UUID, allowNull: true },
        terminate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        in_bin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        binned_at: { type: DataTypes.DATE, allowNull: true },
        binned_by: { type: DataTypes.STRING(255), allowNull: true },
        refresh_token: { type: DataTypes.TEXT, allowNull: true },
        is_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        department_id:{type:DataTypes.UUID,allowNull:true},
        is_hod:{type:DataTypes.BOOLEAN,allowNull:false,defaultValue:false},
        hod_id:{type:DataTypes.UUID,allowNull:true},
        additional_plants:{type:DataTypes.TEXT,allowNull:true,
            get(){
                return JSON.parse(this.getDataValue("additional_plants")) || [];
            },
            set(value){
                this.setDataValue("additional_plants", JSON.stringify(value || []));
            }
        },
    },
    {
        tableName: "users",
        timestamps: true,
        indexes: [
            { fields: ["email"] },
            { fields: ["user_id"] },
            { fields: ["employee_plant"] },
            { fields: ["employee_company"] },
            { fields: ["role"] },
            { fields: ["hod_id"] },
        ],
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
                if (user.email) {
                    user.email = user.email.toLowerCase();
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed("password")) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
                if (user.changed("email") && user.email) {
                    user.email = user.email.toLowerCase();
                }
            },
        },
    }
);

UserModel.prototype.toJSON = function () {
    return this.get({ plain: true });
};