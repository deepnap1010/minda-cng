import winston from "winston";

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
