import { Op } from "sequelize";
import { Sequelize } from "sequelize";
import { SapSyncOutboxModel } from "../models/sapSyncOutbox.model.js";
import { sequelize } from "../sequelize.js";
import { config } from "../config.js";

/**
 * Pull-sync feed consumed by Minda's engineers.
 *
 * Behavior (per Minda handshake):
 * - Every fetch returns ONLY PENDING records. They are marked SENT in the same
 *   transaction, so each record is delivered exactly once — if everything has
 *   already been fetched, the response is empty (count 0).
 * - Retention: SENT records older than SAP_SYNC_RETENTION_DAYS (default 10)
 *   are deleted automatically on each fetch.
 */

const retentionDays = () => {
  const n = Number(config.SAP_SYNC_RETENTION_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 10;
};

/** Delete SENT records older than the retention window. Returns count deleted. */
export const purgeExpiredSentService = async () => {
  const days = retentionDays();
  return SapSyncOutboxModel.destroy({
    where: {
      status: "SENT",
      sent_at: {
        [Op.lt]: Sequelize.literal(`DATEADD(day, -${days}, GETDATE())`),
      },
    },
  });
};

/**
 * Fetch the sync feed. Returns ONLY PENDING rows and flips them to SENT in the
 * same transaction (exactly-once delivery — a repeat fetch returns nothing new).
 * Optional filters: entity_type, limit.
 */
export const fetchSyncDataService = async ({ limit, entity_type } = {}) => {
  // Retention cleanup first: purge SENT rows past the retention window.
  await purgeExpiredSentService();

  return sequelize.transaction(async (t) => {
    const where = { status: "PENDING" };
    if (entity_type) where.entity_type = entity_type;

    const take = Number(limit);
    const rows = await SapSyncOutboxModel.findAll({
      where,
      order: [["createdAt", "ASC"]],
      ...(Number.isFinite(take) && take > 0 ? { limit: Math.min(take, 5000) } : {}),
      transaction: t,
      lock: t.LOCK.UPDATE, // serialize concurrent fetches so no row is delivered twice
    });

    if (!rows.length) return [];

    // Snapshot before flipping so the response still reads status=PENDING —
    // these are exactly the records Minda must push to HANA.
    const result = rows.map((r) => ({
      id: r._id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      status: r.status,
      payload: r.payload,
      created_at: r.createdAt,
    }));

    await SapSyncOutboxModel.update(
      { status: "SENT", sent_at: Sequelize.literal("GETDATE()") },
      { where: { _id: { [Op.in]: rows.map((r) => r._id) } }, transaction: t }
    );

    return result;
  });
};

/** How many records are queued, split by status and entity type (non-mutating). */
export const pendingCountService = async () => {
  const pending = await SapSyncOutboxModel.count({ where: { status: "PENDING" } });
  const sent = await SapSyncOutboxModel.count({ where: { status: "SENT" } });
  const byType = await SapSyncOutboxModel.findAll({
    attributes: [
      "entity_type",
      "status",
      [Sequelize.fn("COUNT", Sequelize.col("_id")), "count"],
    ],
    group: ["entity_type", "status"],
    raw: true,
  });
  return { pending, sent, by_type: byType };
};
