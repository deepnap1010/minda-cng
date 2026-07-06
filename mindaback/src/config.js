/* eslint-disable no-undef */
import dotenv from "dotenv";
dotenv.config();


class Config {
    DB_HOST;
    DB_PORT;
    DB_NAME;
    DB_USER;
    DB_PASSWORD;
    DB_SYNC;
    NODE_ENV;
    LOCAL_CLIENT_URL;
    CLIENT_URL;
    JWT_SECRET;
    EMAIL_AUTH;
    EMAIL_PASSWORD;
    LOCAL_SERVER_URL;
    SERVER_URL;
    REDIS_URL;
    TIMELABS_BASE_URL;
    TIMELABS_AUTH_KEY;
    TIMELABS_ENCRYPTION_KEY;
    MONGODB_URI;
    MONGODB_DB_NAME;
    // ---- SAP integration (teammate; all optional — OFFLINE mode reads config/sap-materials.sample.json) ----
    SAP_MODE;
    SAP_ODATA_BASE_URL;
    SAP_ODATA_USER;
    SAP_ODATA_PASSWORD;
    SAP_WRITE_MODE;
    SAP_HANA_HOST;
    SAP_HANA_PORT;
    SAP_HANA_USER;
    SAP_HANA_PASSWORD;
    SAP_HANA_SCHEMA;
    SAP_SYNC_API_KEY;
    SAP_SYNC_RETENTION_DAYS;
    constructor() {
        this.DB_HOST = process.env.DB_HOST?.trim();
        this.DB_PORT = process.env.DB_PORT?.trim();
        this.DB_NAME = process.env.DB_NAME?.trim();
        this.DB_USER = process.env.DB_USER?.trim();
        this.DB_PASSWORD = process.env.DB_PASSWORD?.trim();
        this.DB_SYNC = process.env.DB_SYNC?.trim();
        this.NODE_ENV = process.env.NODE_ENV?.trim();
        this.LOCAL_CLIENT_URL = process.env.LOCAL_CLIENT_URL?.trim();
        this.CLIENT_URL = process.env.CLIENT_URL?.trim();
        this.JWT_SECRET = process.env.JWT_SECRET?.trim();
        this.EMAIL_AUTH = process.env.EMAIL_AUTH?.trim();
        this.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD?.trim();
        this.SERVER_URL = process.env.SERVER_URL?.trim();
        this.LOCAL_SERVER_URL = process.env.LOCAL_SERVER_URL?.trim();
        this.REDIS_URL = process.env.REDIS_URL?.trim();
        this.TIMELABS_BASE_URL = process.env.TIMELABS_BASE_URL?.trim();
        this.TIMELABS_AUTH_KEY = process.env.TIMELABS_AUTH_KEY?.trim();
        this.TIMELABS_ENCRYPTION_KEY = process.env.TIMELABS_ENCRYPTION_KEY?.trim();
        this.INTEGRATION_API_KEY = process.env.INTEGRATION_API_KEY?.trim();
        // ---- CNG telemetry Mongo (was never mapped — the gap that kept raw telemetry disabled) ----
        this.MONGODB_URI = process.env.MONGODB_URI?.trim();
        this.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME?.trim();
        // ---- SAP integration (teammate) ----
        this.SAP_MODE = process.env.SAP_MODE?.trim() || "offline";
        this.SAP_ODATA_BASE_URL = process.env.SAP_ODATA_BASE_URL?.trim();
        this.SAP_ODATA_USER = process.env.SAP_ODATA_USER?.trim();
        this.SAP_ODATA_PASSWORD = process.env.SAP_ODATA_PASSWORD?.trim();
        this.SAP_WRITE_MODE = process.env.SAP_WRITE_MODE?.trim() || "none";
        this.SAP_HANA_HOST = process.env.SAP_HANA_HOST?.trim();
        this.SAP_HANA_PORT = process.env.SAP_HANA_PORT?.trim();
        this.SAP_HANA_USER = process.env.SAP_HANA_USER?.trim();
        this.SAP_HANA_PASSWORD = process.env.SAP_HANA_PASSWORD?.trim();
        this.SAP_HANA_SCHEMA = process.env.SAP_HANA_SCHEMA?.trim();
        this.SAP_SYNC_API_KEY = process.env.SAP_SYNC_API_KEY?.trim();
        this.SAP_SYNC_RETENTION_DAYS = process.env.SAP_SYNC_RETENTION_DAYS?.trim() || "10";
    }
};

export const config = new Config();