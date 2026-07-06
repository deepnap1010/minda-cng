import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";
import { PlantModel } from "./plant.modal.js";
import { CompanyModel } from "./company.modal.js";



export const AssemblyModal = sequelize.define(
  "Assembly",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },

    assembly_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    assembly_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },

    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    plant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    responsibility: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    part_id: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "assemblies",
    timestamps: true,

    hooks: {
      beforeCreate: async (assembly, options) => {
        // 1️⃣ Company
        const company = await CompanyModel.findByPk(assembly.company_id);
        if (!company?.company_code) {
          throw new Error("Company code not found");
        }

        // 2️⃣ Plant
        const plant = await PlantModel.findByPk(assembly.plant_id);
        if (!plant?.plant_code) {
          throw new Error("Plant code not found");
        }

        // 3️⃣ Last assembly for company + plant
        const lastAssembly = await AssemblyModal.findOne({
          where: {
            company_id: assembly.company_id,
            plant_id: assembly.plant_id,
          },
          order: [["createdAt", "DESC"]],
        });

        let nextNumber = 1;

        if (lastAssembly?.assembly_number) {
          const lastRunning =
            lastAssembly.assembly_number.split("-").pop();
          nextNumber = parseInt(lastRunning, 10) + 1;
        }

        // 4️⃣ Pad → 0001
        const runningNumber = String(nextNumber).padStart(4, "0");

        // 5️⃣ Set BEFORE save
        assembly.assembly_number = `${company.company_code}-${plant.plant_code}-${runningNumber}`;
      },
    },

    indexes: [
      {
        name: "idx_assemblies_main",
        fields: [
          "company_id",
          "plant_id",
          "responsibility",
          "assembly_name",
          "assembly_number",
        ],
      },
    ],
  }
);
