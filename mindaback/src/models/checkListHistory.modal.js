    import { DataTypes, Sequelize } from "sequelize";
    import { sequelize } from "../sequelize.js";

    export const CheckListHistoryModal = sequelize.define(
        "CheckListHistory",
        {
            _id: {
                type: DataTypes.UUID,
                defaultValue: Sequelize.literal("NEWID()"),
                primaryKey: true,
            },
            checkList: { type: DataTypes.UUID, allowNull: false },
            assembly: { type: DataTypes.UUID, allowNull: false },
            process_id: { type: DataTypes.UUID, allowNull: false },
            user_id: { type: DataTypes.UUID, allowNull: false },
            result: { type: DataTypes.STRING(100), allowNull: false },
            is_error: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            is_resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            description: { type: DataTypes.TEXT, allowNull: true },
            status: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: "Unchecked",
                validate: {
                    isIn: [["Checked", "Unchecked"]],
                },
            },
        },
        {
            tableName: "checklisthistories",
            timestamps: true,
            indexes: [{ name: "idx_ch_history", fields: ["checkList", "assembly", "process_id", "result", "status"] }],
        }
    );

    CheckListHistoryModal.prototype.toJSON = function () {
        return this.get({ plain: true });
    };


