import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

/**
 * Transactional OUTBOX for the SAP write-back (dual-write).
 *
 * When a template definition is created or a submission is submitted, we write
 * the business row to MSSQL AND insert a row here in the SAME transaction. A
 * background drainer then pushes each pending row to SAP (HANA Cloud or OData,
 * chosen by SAP_WRITE_MODE) with retry/back-off. This guarantees we never lose
 * a record if SAP is briefly down, and never double-write.
 */
export const SapSyncOutboxModel = sequelize.define(
  "SapSyncOutbox",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    // What kind of entity this row represents in SAP terms.
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { isIn: [["TEMPLATE_DEFINITION", "TEMPLATE_SUBMISSION"]] },
    },
    // The local MSSQL primary key of the source row (template_masters._id or
    // template_submissions._id).
    entity_id: { type: DataTypes.UUID, allowNull: false },
    // Full JSON snapshot of the payload to push to SAP (stringified).
    payload: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue("payload");
        try {
          return raw ? JSON.parse(raw) : null;
        } catch {
          return raw;
        }
      },
      set(value) {
        this.setDataValue(
          "payload",
          typeof value === "string" ? value : JSON.stringify(value ?? null)
        );
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "PENDING",
      validate: { isIn: [["PENDING", "SENT", "FAILED"]] },
    },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    last_error: { type: DataTypes.TEXT, allowNull: true },
    // SAP's response reference once sent (e.g. the created document key).
    sap_reference: { type: DataTypes.STRING(255), allowNull: true },
    sent_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    timestamps: true,
    tableName: "sap_sync_outbox",
    indexes: [
      { fields: ["status"] },
      { fields: ["entity_type", "entity_id"] },
    ],
  }
);
