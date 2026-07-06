import { Op } from "sequelize";
import { Sequelize } from "sequelize";
import { SapMaterialModel } from "../models/sapMaterial.model.js";
import { sapClient } from "./sapClient.js";

/**
 * Pull the full material master from SAP (or the offline fixture) and upsert it
 * into the local sap_materials cache. Descriptions of "NOT IN USE" are marked
 * is_active=false so the dropdown can hide retired materials by default.
 *
 * Runs as a bulk upsert in batches to stay within MSSQL parameter limits.
 */
export const syncMaterialsService = async () => {
  const materials = await sapClient.getAllMaterials();

  const rows = materials
    .filter((m) => m.material) // guard against blank keys
    .map((m) => ({
      material: String(m.material),
      description: m.description ?? null,
      material_type: m.material_type ?? null,
      base_uom: m.base_uom ?? null,
      is_active: (m.description || "").trim().toUpperCase() !== "NOT IN USE",
      synced_at: Sequelize.literal("GETDATE()"),
    }));

  // MSSQL does not support bulkCreate's updateOnDuplicate, so we use per-row
  // upsert (Sequelize compiles this to a MERGE on MSSQL). Run in small
  // concurrent batches to keep it fast without exhausting the connection pool.
  const BATCH = 25;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await Promise.all(chunk.map((row) => SapMaterialModel.upsert(row)));
    upserted += chunk.length;
  }

  return { source: sapClient.mode(), total: materials.length, upserted };
};

/**
 * Search the local material cache for the MATERIAL_LOOKUP dropdown.
 * Matches on material code OR description. Excludes retired (is_active=false)
 * unless includeInactive=true.
 */
export const searchMaterialsService = async ({
  search = "",
  type,
  includeInactive = false,
  limit = 20,
} = {}) => {
  const where = {};
  if (!includeInactive) where.is_active = true;
  if (type) where.material_type = type;
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    where[Op.or] = [{ material: { [Op.like]: q } }, { description: { [Op.like]: q } }];
  }

  const rows = await SapMaterialModel.findAll({
    where,
    limit: Math.min(Number(limit) || 20, 100),
    order: [["material", "ASC"]],
    attributes: ["material", "description", "material_type", "base_uom"],
  });
  return rows;
};

/** Fetch one material by its exact SAP key (used to auto-fill companion fields). */
export const getMaterialByKeyService = async (material) => {
  return SapMaterialModel.findByPk(String(material), {
    attributes: ["material", "description", "material_type", "base_uom", "is_active"],
  });
};

/** Distinct material types — powers an optional type filter in the UI. */
export const getMaterialTypesService = async () => {
  const rows = await SapMaterialModel.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("material_type")), "material_type"],
    ],
    where: { material_type: { [Op.ne]: null } },
    order: [["material_type", "ASC"]],
    raw: true,
  });
  return rows.map((r) => r.material_type).filter(Boolean);
};
