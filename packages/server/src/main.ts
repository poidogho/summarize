import { createApp } from "./infrastructure/http/app.js";
import { startServer } from "./infrastructure/http/server.js";
import { createLogger } from "./infrastructure/logging/logger.js";
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env");
loadEnv({ path: envPath });

const logger = createLogger("api");
const port = Number(process.env.PORT) || 4000;

const app = createApp(logger);
startServer(app, port, logger);
