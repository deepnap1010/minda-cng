import winston from "winston";
import fs from "fs";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),       // 🔥 adds colors
    winston.format.timestamp(),      // optional: timestamp
    winston.format.printf(({ level, message }) => {
      return `[${level}]=====>>> : ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Dedicated audit log for the SAP-facing /sync feeds: every hit lands in its own
// file (logs/sync-access.log, rotated at 5 MB × 3 files) AND still echoes to the
// console so it shows in pm2 logs too. winston's File transport does not create
// the directory, so ensure it exists first.
try { fs.mkdirSync("logs", { recursive: true }); } catch { /* already exists */ }

export const syncAccessLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, message }) => `${timestamp} ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "logs/sync-access.log",
      maxsize: 5 * 1024 * 1024, // rotate at 5 MB
      maxFiles: 3,              // keep at most 3 rotated files
    }),
  ],
});
