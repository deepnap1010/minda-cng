import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

/**
 * Local cache of SAP Material Master (pulled from the ZODATA_MAT_API OData
 * service). We NEVER hit SAP on every keystroke — the MATERIAL_LOOKUP field
 * type searches this table instead, and a background job keeps it in sync.
 *
 * `material` is the SAP business key (can be numeric, coded, or free-form with
 * slashes/spaces, e.g. "147", "CM-HDW-XX-XX-20001", "81905X3000/SET KEY"),
 * so it is a STRING primary key — not a UUID.
 */
export const SapMaterialModel = sequelize.define(
  "SapMaterial",
  {
    material: { type: DataTypes.STRING(100), primaryKey: true }, // SAP "Material"
    description: { type: DataTypes.STRING(255), allowNull: true }, // SAP "Description"
    material_type: { type: DataTypes.STRING(20), allowNull: true }, // SAP "MaterialType" (ZHDW, ZSPR, ...)
    base_uom: { type: DataTypes.STRING(20), allowNull: true }, // SAP "BaseUOM" (NOS, EA, ...)
    // "NOT IN USE" descriptions => retired materials. We keep them but flag them
    // so the dropdown can hide them by default.
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    synced_at: { type: DataTypes.DATE, allowNull: true, defaultValue: Sequelize.literal("GETDATE()") },
  },
  {
    timestamps: true,
    tableName: "sap_materials",
    indexes: [
      { fields: ["material_type"] },
      { fields: ["is_active"] },
    ],
  }
);
