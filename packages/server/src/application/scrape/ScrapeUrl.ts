import { load } from "cheerio";
import fetch from "node-fetch";
import type { Logger } from "../../infrastructure/logging/logger.js";
import { parseUrl } from "../../domain/scrape/Url.js";

export type ScrapeResult = {
  url: string;
  title: string | null;
  description: string | null;
};

export const scrapeUrl = async (
  rawUrl: string,
  logger: Logger
): Promise<ScrapeResult> => {
  try {
    const url = parseUrl(rawUrl);
    logger.info("scrape_start", { url: url.toString() });

    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      throw new Error("fetch_failed");
    }

    const html = await response.text();
    const $ = load(html);
    const title = $("title").first().text().trim() || null;
    const description =
      $("meta[name=description]").attr("content")?.trim() || null;

    logger.info("scrape_complete", { url: url.toString() });
    return {
      url: url.toString(),
      title,
      description,
    };
  } catch (error) {
    logger.error("scrape_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
