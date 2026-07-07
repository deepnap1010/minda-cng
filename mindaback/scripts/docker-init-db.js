// Create the target database (JPMDO) if it doesn't exist, then exit. Runs inside
// the backend container BEFORE the app boots (see the "command" in
// docker-compose.yml). Uses Sequelize + tedious, which are already installed, so
// there is NO dependency on an external SQL-client image. Connection options
// mirror src/sequelize.js so it behaves exactly like the app.
import { Sequelize } from "sequelize";

const {
  DB_HOST = "mssql",
  DB_PORT = "1433",
  DB_USER = "sa",
  DB_PASSWORD = "",
  DB_NAME = "JPMDO",
} = process.env;

// Connect to the always-present "master" db so we can CREATE the target db.
const master = new Sequelize("master", DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT) || 1433,
  dialect: "mssql",
  logging: false,
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 30000,
    },
  },
  retry: { max: 0 },
});

async function run() {
  // SQL Server takes 20-40s to accept connections on a cold container start.
  for (let i = 1; i <= 60; i++) {
    try {
      await master.authenticate();
      break;
    } catch (e) {
      if (i === 60) {
        console.error("SQL Server unreachable after ~3 min:", e.message);
        process.exit(1);
      }
      console.log(`waiting for SQL Server (${i}/60)...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  await master.query(`IF DB_ID(N'${DB_NAME}') IS NULL CREATE DATABASE [${DB_NAME}];`);
  console.log(`Database ${DB_NAME} is ready.`);
  await master.close();
  process.exit(0);
}

run();
