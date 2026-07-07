// src/config/mongodb.js
// MongoDB connection for the CNG live-telemetry store ONLY (the raw, accept-
// everything time-series of machine readings). Completely separate from the
// SQL Server (JPMDO) business data. Mirrors the Redis pattern: non-fatal, so a
// missing/invalid MONGODB_URI never crashes the process — telemetry simply runs
// in "disabled" mode and the rest of the API stays up.

import mongoose from "mongoose";
import { config } from "../config.js";

let connected = false;

export async function ensureMongoConnected() {
  if (!config.MONGODB_URI) {
    return null; // telemetry store disabled — no URI configured
  }
  try {
    if (connected && mongoose.connection.readyState === 1) return mongoose.connection;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.MONGODB_URI, {
        dbName: config.MONGODB_DB_NAME, // isolate CNG telemetry in its own DB
        serverSelectionTimeoutMS: 4000,
        maxPoolSize: 10,
      });
    }
    connected = true;
    return mongoose.connection;
  } catch (error) {
    connected = false;
    console.error("Mongo (CNG telemetry) unavailable:", error?.message || error);
    return null;
  }
}

export function isMongoReady() {
  return connected && mongoose.connection.readyState === 1;
}
