import express from "express";
import type { Logger } from "../logging/logger.js";
import { registerHealthRoute } from "./health-route.js";
import { registerFileRoute } from "./file-route.js";
import { registerScrapeRoute } from "./scrape-route.js";

export const createApp = (logger: Logger) => {
  const app = express();

  app.use(express.json());
  app.use((req, _res, next) => {
    logger.info("request", {
      method: req.method,
      path: req.path,
    });
    next();
  });

  const router = express.Router();
  registerHealthRoute(router);
  registerFileRoute(router, logger);
  registerScrapeRoute(router, logger);
  app.use("/api", router);

  return app;
};
