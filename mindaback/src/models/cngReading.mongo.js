// Mongo model for the CNG raw telemetry store — the "accept everything" sink.
// rawPayload holds the original packet verbatim (audit/replay); `data` holds the
// extracted measurement bag. strict:false keeps any unexpected fields too. This
// is the EKC `Telemetry.raw` + `Telemetry.data` pattern, in Mongo, exactly like
// the proven EKC/JCI platforms.

import mongoose from "mongoose";

const CngReadingSchema = new mongoose.Schema(
  {
    machineId: { type: String, index: true }, // "UNIDENTIFIED" if the packet had no id
    pipeId: { type: String, default: null, index: true }, // resolved via scan-in or inline
    dialect: { type: String, default: null }, // 'EKC' | 'JCI' | null
    stageNo: { type: Number, default: null },
    source: { type: String, default: "ingest" }, // ingest | simulator | manual
    rawPayload: { type: mongoose.Schema.Types.Mixed, required: true }, // verbatim packet
    data: { type: mongoose.Schema.Types.Mixed, default: {} }, // extracted measurements
    clean: { type: mongoose.Schema.Types.Mixed, default: {} }, // normalized clean metrics
    flags: { type: [String], default: [] },
    deviceTs: { type: Date, default: null },
    serverTs: { type: Date, default: Date.now, index: true },
  },
  { strict: false, minimize: false, versionKey: false, collection: "cng_machine_readings" }
);

// Latest-per-machine + history; latest-per-pipe timeline.
CngReadingSchema.index({ machineId: 1, serverTs: -1 });
CngReadingSchema.index({ pipeId: 1, serverTs: -1 });

export const CngReadingModel =
  mongoose.models.CngReading || mongoose.model("CngReading", CngReadingSchema);
