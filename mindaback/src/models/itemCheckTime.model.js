import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";



export const ItemCheckTimeModel = sequelize.define(
    "ItemCheckTime",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        item_id: { type: DataTypes.UUID, allowNull: false },
        check_time:{ type: DataTypes.TIME, allowNull: false }
    }, {
    timestamps: true,
    tableName: "item_check_time"
});

ItemCheckTimeModel.prototype.toJSON = function () {
    const values = { ...this.get() };
    return values;
};





