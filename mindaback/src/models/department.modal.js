import {DataTypes,Sequelize} from "sequelize";
import {sequelize} from "../sequelize.js";


export const DepartmentModel = sequelize.define(
    "Department",
    {
      _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        name:{type:DataTypes.STRING(255),allowNull:false,unique:true},
        description:{type:DataTypes.TEXT,allowNull:true}
    },
    {
        timestamps:true,
        tableName:"departments",
        indexes:[{fields:["name"]}]
    }
    );



DepartmentModel.prototype.toJSON = function () {
    return this.get({ plain: true });
};