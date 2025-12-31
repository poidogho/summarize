import type { Router } from "express";
import { scrapeUrl } from "../../application/scrape/ScrapeUrl.js";
import type { Logger } from "../logging/logger.js";

const mapErrorToStatus = (message: string): number => {
  if (message.startsWith("url_")) return 400;
  if (message === "fetch_failed") return 502;
  return 500;
};

export const registerScrapeRoute = (router: Router, logger: Logger): void => {
  router.post("/scrape", async (req, res) => {
    const rawUrl = typeof req.body?.url === "string" ? req.body.url : "";

    try {
      const result = await scrapeUrl(rawUrl, logger);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      logger.warn("scrape_request_failed", { message });
      res.status(mapErrorToStatus(message)).json({ error: message });
    }
  });
};
