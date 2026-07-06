import { Sequelize,DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";


export const DocumentModel = sequelize.define('Document', {
    _id:{type:DataTypes.UUID,defaultValue:Sequelize.literal("NEWID()"),primaryKey:true},
    doc_name: { type: DataTypes.STRING, allowNull: false },
    depart_name : { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    expiry: { type: DataTypes.DATE, allowNull: true },
    attached_doc: { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: "documents",
    timestamps: true,
});











