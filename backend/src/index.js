// src/index.js
import app from "./server.js";
import config from "./config/index.js";
import logger from "./lib/logger.js";

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`SentinelSwarm API listening on port ${PORT}`);
});
