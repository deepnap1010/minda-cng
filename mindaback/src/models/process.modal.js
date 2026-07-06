import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";
import { CompanyModel } from "./company.modal.js";
import { PlantModel } from "./plant.modal.js";

export const ProcessModel = sequelize.define(
    "Process",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        process_name: { type: DataTypes.STRING(255), allowNull: false },
        process_no: { type: DataTypes.STRING(255), allowNull: true, unique: true },
        company_id: { type: DataTypes.UUID, allowNull: false },
        plant_id: { type: DataTypes.UUID, allowNull: false },
    },
    {
        tableName: "processes",
        timestamps: true,
        hooks: {
            beforeCreate: async (process, options) => {

                // 1️⃣ Get Company
                const company = await CompanyModel.findByPk(process.company_id);
                if (!company || !company.company_code) {
                    throw new Error("Company code not found");
                }

                // 2️⃣ Get Plant
                const plant = await PlantModel.findByPk(process.plant_id);
                if (!plant || !plant.plant_code) {
                    throw new Error("Plant code not found");
                }

                // 3️⃣ Find last process for same company + plant
                const lastProcess = await ProcessModel.findOne({
                    where: {
                        company_id: process.company_id,
                        plant_id: process.plant_id,
                    },
                    order: [["createdAt", "DESC"]],
                });

                let nextNumber = 1;

                if (lastProcess?.process_no) {
                    const lastRunning = lastProcess.process_no.split("-").pop();
                    nextNumber = parseInt(lastRunning, 10) + 1;
                }

                // 4️⃣ Pad number → 0001
                const runningNumber = String(nextNumber).padStart(4, "0");

                // 5️⃣ Set process_no BEFORE SAVE
                process.process_no = `${company.company_code}-${plant.plant_code}-${runningNumber}`;
            },
        },
        indexes: [
            { fields: ["process_name"] },
            { unique: true, fields: ["process_no"] },
        ],
    }
);

ProcessModel.prototype.toJSON = function () {
    return this.get({ plain: true });
};
