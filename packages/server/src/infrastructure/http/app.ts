import express from "express";
import type { Logger } from "../logging/logger.js";
import { registerHealthRoute } from "./health-route.js";

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
  app.use("/api", router);

  return app;
};
