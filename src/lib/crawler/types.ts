/**
 * Crawler Types
 *
 * Type definitions for the news crawling module.
 */

export interface NewsPortalConfig {
  name: string;
  baseUrl: string;
  /** CSS selector for article links on the listing page */
  articleLinkSelector: string;
  /** CSS selector for article title */
  titleSelector: string;
  /** CSS selector for article content */
  contentSelector: string;
  /** CSS selector for publish date (optional) */
  dateSelector?: string;
  /** Date format pattern for parsing */
  dateFormat?: string;
  /** Elements to remove from content (ads, scripts, etc.) */
  removeSelectors?: string[];
  /** Request delay in ms between fetches */
  delayMs?: number;
}

export interface RawArticle {
  url: string;
  title: string;
  content: string | null;
  publishedAt: Date | null;
  portal: string;
}

export interface CrawlResult {
  portal: string;
  success: boolean;
  articlesFound: number;
  articlesCrawled: number;
  newArticles: number;
  errors: string[];
  durationMs: number;
}

export interface CrawlSummary {
  totalPortals: number;
  successfulPortals: number;
  failedPortals: number;
  totalArticlesFound: number;
  totalNewArticles: number;
  totalDurationMs: number;
  results: CrawlResult[];
}

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  retryDelayMs?: number;
  headers?: Record<string, string>;
}

export const DEFAULT_FETCH_OPTIONS: FetchOptions = {
  timeout: 15000,
  retries: 2,
  retryDelayMs: 1000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  },
};
