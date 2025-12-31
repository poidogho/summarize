import { load } from "cheerio";
import fetch from "node-fetch";
import type { Logger } from "../../infrastructure/logging/logger.js";
import { parseUrl } from "../../domain/scrape/Url.js";

export type ScrapeResult = {
  url: string;
  title: string | null;
  description: string | null;
  content: string | null;
};

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const parseHtml = (html: string) => {
  const $ = load(html);
  const title = $("title").first().text().trim() || null;
  const description =
    $("meta[name=description]").attr("content")?.trim() || null;
  const content = normalizeText($("body").text()) || null;

  return { title, description, content };
};

const scrapeWithFetch = async (url: URL) => {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error("fetch_failed");
  }

  const html = await response.text();
  return parseHtml(html);
};

const scrapeWithPlaywright = async (url: URL) => {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(url.toString(), { waitUntil: "networkidle" });

    const title = (await page.title()) || null;
    const description = await page
      .$eval("meta[name=description]", (el) => el.getAttribute("content"))
      .catch(() => null);
    const content =
      normalizeText(await page.evaluate(() => document.body.innerText)) || null;

    return {
      title: title?.trim() || null,
      description: description?.trim() || null,
      content,
    };
  } finally {
    await browser.close();
  }
};

export const scrapeUrl = async (
  rawUrl: string,
  logger: Logger
): Promise<ScrapeResult> => {
  try {
    const url = parseUrl(rawUrl);
    logger.info("scrape_start", { url: url.toString() });

    const usePlaywright = process.env.SCRAPE_USE_PLAYWRIGHT === "true";
    let result = await scrapeWithFetch(url);

    if (
      usePlaywright ||
      (!result.title && !result.description && !result.content)
    ) {
      logger.info("scrape_rendering", { url: url.toString() });
      result = await scrapeWithPlaywright(url);
    }

    logger.info("scrape_complete", { url: url.toString() });
    return {
      url: url.toString(),
      ...result,
    };
  } catch (error) {
    logger.error("scrape_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
