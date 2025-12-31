import type { Server } from "node:http";
import type { Express } from "express";
import type { Logger } from "../logging/logger.js";

export const startServer = (app: Express, port: number, logger: Logger): Server => {
  const server = app.listen(port, () => {
    logger.info("server_started", { port });
  });

  const shutdown = (signal: string) => {
    logger.warn("shutdown_start", { signal });

    const timeout = setTimeout(() => {
      logger.error("shutdown_timeout");
      process.exit(1);
    }, 10_000);
    timeout.unref();

    server.close(() => {
      logger.info("shutdown_complete");
      clearTimeout(timeout);
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  return server;
};
