// SAP integration tables. New + additive (no FKs into MINDA). The inbox stores
// whatever SAP pushes, verbatim (raw-first / accept-everything), so we never lose
// data while we learn SAP's exact document shapes.

import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

const pk = () => ({
  type: DataTypes.UUID,
  defaultValue: Sequelize.literal("NEWID()"),
  primaryKey: true,
});

// One row per payload SAP pushes. raw_payload = the body exactly as received.
export const SapInboxModel = sequelize.define(
  "SapInbox",
  {
    _id: pk(),
    doc_type: { type: DataTypes.STRING(120), allowNull: true }, // extracted hint (docType/type/idoc)
    source_ref: { type: DataTypes.STRING(255), allowNull: true }, // extracted id/ref if present
    raw_payload: { type: DataTypes.JSON, allowNull: true }, // verbatim body
    headers: { type: DataTypes.JSON, allowNull: true }, // request headers (secrets stripped)
    content_type: { type: DataTypes.STRING(120), allowNull: true },
    source_ip: { type: DataTypes.STRING(60), allowNull: true },
    flags: { type: DataTypes.JSON, allowNull: true },
    processed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // for later mapping
    received_at: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at", tableName: "sap_inbox" }
);

// x-api-keys SAP uses to authenticate (stored hashed, never plaintext).
export const SapIngestKeyModel = sequelize.define(
  "SapIngestKey",
  {
    _id: pk(),
    key_hash: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(120), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    last_used_at: { type: DataTypes.DATE, allowNull: true },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at", tableName: "sap_ingest_key" }
);

export const SapModels = { SapInboxModel, SapIngestKeyModel };
