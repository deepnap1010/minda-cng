import { logger } from "./utils/logger.js";
import { config } from "./config.js";
import { initModels } from "./models/initModels.js";
import { sequelize } from "./sequelize.js";

export const CheckDbConnection = async () => {
    let isConnected = false;
    do {
        try {
            logger.info("Attempting to authenticate with SQL Server...");
            await sequelize.authenticate();
            logger.info("Authentication successful. Initializing models...");
            
            initModels();
            logger.info("Models initialized.");
            
            if (config.DB_SYNC === "true" || config.NODE_ENV === "development") {
                logger.info("Starting database sync...");
                // SQL Server: drop all FKs first so template_masters (and other tables) can be dropped
                await sequelize.query(`
                    DECLARE @sql NVARCHAR(MAX) = '';
                    SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
                    FROM sys.foreign_keys;
                    IF LEN(@sql) > 0 EXEC sp_executesql @sql;
                `);
                await sequelize.sync({ alter: false, force: false });
                logger.info("Database sync completed.");
            }
            
            logger.info(`SQL Server Connection successful ${config.DB_HOST}:${config.DB_PORT || 1433}/${config.DB_NAME}`);
            isConnected = true;
        } catch (error) {
            const errorDetails = {
                message: error.message,
                name: error.name,
                originalMessage: error.original?.message || error.message,
                sql: error.sql || null,
                host: config.DB_HOST,
                port: config.DB_PORT || 1433,
                database: config.DB_NAME,
                user: config.DB_USER,
            };
            logger.error("Error connecting to SQL Server:", errorDetails);
            if (error.stack) {
                logger.error("Stack trace:", error.stack);
            }
            logger.info("Retrying in 5 seconds...");
            await new Promise((r) => globalThis.setTimeout(r, 5000));
        }
    } while (!isConnected);
};

