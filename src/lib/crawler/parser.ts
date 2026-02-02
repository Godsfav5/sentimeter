/**
 * HTML Parser
 *
 * Parses news article HTML using cheerio.
 */

import * as cheerio from "cheerio";
import type { NewsPortalConfig, RawArticle } from "./types.ts";

/**
 * Parse article listing page to extract article URLs
 */
export function parseArticleLinks(
  html: string,
  config: NewsPortalConfig
): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  const seen = new Set<string>();

  $(config.articleLinkSelector).each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    const fullUrl = resolveUrl(href, config.baseUrl);
    if (!fullUrl || seen.has(fullUrl)) return;

    // Filter out non-article URLs
    if (isValidArticleUrl(fullUrl, config)) {
      seen.add(fullUrl);
      links.push(fullUrl);
    }
  });

  return links;
}

/**
 * Parse individual article page
 */
export function parseArticle(
  html: string,
  url: string,
  config: NewsPortalConfig
): RawArticle | null {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  if (config.removeSelectors) {
    config.removeSelectors.forEach((selector) => {
      $(selector).remove();
    });
  }

  // Extract title
  const title = extractTitle($, config.titleSelector);
  if (!title) {
    return null;
  }

  // Extract content
  const content = extractContent($, config.contentSelector);

  // Extract publish date
  const publishedAt = extractDate($, config.dateSelector);

  return {
    url,
    title,
    content,
    publishedAt,
    portal: config.name,
  };
}

/**
 * Extract article title
 */
function extractTitle($: cheerio.CheerioAPI, selector: string): string | null {
  const selectors = selector.split(",").map((s) => s.trim());

  for (const sel of selectors) {
    const element = $(sel).first();
    const text = element.text().trim();
    if (text && text.length > 10) {
      return cleanText(text);
    }
  }

  return null;
}

/**
 * Extract article content
 */
function extractContent(
  $: cheerio.CheerioAPI,
  selector: string
): string | null {
  const selectors = selector.split(",").map((s) => s.trim());

  for (const sel of selectors) {
    const element = $(sel).first();
    if (element.length === 0) continue;

    // Get text from paragraphs
    const paragraphs: string[] = [];
    element.find("p").each((_, p) => {
      const text = $(p).text().trim();
      if (text && text.length > 20) {
        paragraphs.push(text);
      }
    });

    if (paragraphs.length > 0) {
      return cleanText(paragraphs.join("\n\n"));
    }

    // Fallback to full text
    const fullText = element.text().trim();
    if (fullText && fullText.length > 50) {
      return cleanText(fullText);
    }
  }

  return null;
}

/**
 * Extract publish date
 */
function extractDate(
  $: cheerio.CheerioAPI,
  selector?: string
): Date | null {
  if (!selector) return null;

  const selectors = selector.split(",").map((s) => s.trim());

  for (const sel of selectors) {
    const element = $(sel).first();

    // Check datetime attribute first
    const datetime = element.attr("datetime");
    if (datetime) {
      const parsed = new Date(datetime);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Try parsing text content
    const text = element.text().trim();
    if (text) {
      const parsed = parseIndonesianDate(text);
      if (parsed) return parsed;
    }
  }

  return null;
}

/**
 * Parse Indonesian date formats
 * Examples: "Senin, 03 Feb 2025 10:30 WIB", "3 Februari 2025"
 */
function parseIndonesianDate(text: string): Date | null {
  const months: Record<string, number> = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, agu: 7, aug: 7,
    september: 8, sep: 8,
    oktober: 9, okt: 9, oct: 9,
    november: 10, nov: 10,
    desember: 11, des: 11, dec: 11,
  };

  // Pattern: "03 Feb 2025" or "3 Februari 2025"
  const datePattern = /(\d{1,2})\s+(\w+)\s+(\d{4})/i;
  const match = text.match(datePattern);

  if (match) {
    const day = parseInt(match[1] ?? "0", 10);
    const monthStr = (match[2] ?? "").toLowerCase();
    const year = parseInt(match[3] ?? "0", 10);

    const month = months[monthStr];
    if (month !== undefined && day > 0 && year > 2000) {
      return new Date(year, month, day);
    }
  }

  // Try ISO format
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    const parsed = new Date(isoMatch[0]);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

/**
 * Clean text content
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    if (href.startsWith("http")) {
      return href;
    }
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Check if URL is a valid article URL (not category, tag, etc.)
 */
function isValidArticleUrl(url: string, config: NewsPortalConfig): boolean {
  const lowercaseUrl = url.toLowerCase();

  // Skip common non-article patterns
  const skipPatterns = [
    "/tag/",
    "/tags/",
    "/category/",
    "/kategori/",
    "/author/",
    "/penulis/",
    "/page/",
    "/search",
    "/login",
    "/register",
    "#",
    "javascript:",
  ];

  if (skipPatterns.some((pattern) => lowercaseUrl.includes(pattern))) {
    return false;
  }

  // Must be from same domain
  try {
    const urlDomain = new URL(url).hostname;
    const baseDomain = new URL(config.baseUrl).hostname;
    if (!urlDomain.includes(baseDomain.replace("www.", ""))) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}
