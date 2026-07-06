// src/sequelize.js
import { Sequelize } from "sequelize";
import { config } from "./config.js";

// Notes on the tuning below:
// - Production has multiple PLC agents POSTing concurrently. Pool of 5
//   was too small: as soon as one query slowed down, the pool jammed and
//   every other request bombed with SequelizeConnectionAcquireTimeoutError.
// - requestTimeout default in tedious is 15000ms. Even with correct indexes
//   we keep a 60s safety net so a one-off slow query doesn't take the API down.
// - dialectOptions.options is the correct nesting for Sequelize v6 + tedious:
//   contents of `options` are passed straight to the tedious driver's
//   options object.
export const sequelize = new Sequelize(
    config.DB_NAME,
    config.DB_USER,
    config.DB_PASSWORD,
    {
        host: config.DB_HOST,
        port: config.DB_PORT ? Number(config.DB_PORT) : 1433,
        dialect: "mssql",
        timezone: "+05:30",
        dialectOptions: {
            options: {
                encrypt: true,
                trustServerCertificate: true,
                enableArithAbort: true,
                requestTimeout: 60000,   // 60s per query
                connectTimeout: 30000,
            },
        },
        pool: {
            max: 25,        // was 5 — handle concurrent PLC POSTs
            min: 2,         // keep warm connections ready
            acquire: 60000, // wait up to 60s for a free connection
            idle: 10000,
            evict: 10000,
        },
        retry: {
            max: 2,         // transient deadlock / connection blip retry
        },
        logging: false,
    }
);