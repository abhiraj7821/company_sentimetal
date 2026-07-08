// src/lib/logger.js
import pino from "pino";
import config from "../config/index.js";

const logger = pino({
  level: config.logLevel,
  transport:
    config.nodeEnv === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        }
      : undefined, // production uses default JSON logging
});

export default logger;
