import { createApp } from "./infrastructure/http/app.js";
import { startServer } from "./infrastructure/http/server.js";
import { createLogger } from "./infrastructure/logging/logger.js";

const logger = createLogger("api");
const port = Number(process.env.PORT) || 4000;

const app = createApp(logger);
startServer(app, port, logger);
