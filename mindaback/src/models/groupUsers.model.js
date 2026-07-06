import {Sequelize,DataTypes} from "sequelize";
import {sequelize} from "../sequelize.js";


export const GroupUsersModel  = sequelize.define("GroupUser",{
    _id:{type:DataTypes.UUID,defaultValue:Sequelize.literal("NEWID()"),primaryKey:true},
    user_id:{type:DataTypes.UUID,allowNull:false},
    plants_id:{type:DataTypes.TEXT,allowNull:false},
    relese_group_id:{type:DataTypes.UUID,allowNull:false}
},
{
    timestamps:true,
    tableName:"group_user"
});




