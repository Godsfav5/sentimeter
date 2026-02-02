/**
 * Crawler Module
 *
 * ⚠️ AI AGENTS: This module is split into submodules:
 * - types.ts: Type definitions
 * - fetcher.ts: HTTP fetching with rate limiting
 * - parser.ts: HTML parsing with cheerio
 * - portal-configs.ts: News portal configurations
 * - deduplicator.ts: Hash-based deduplication
 * - orchestrator.ts: Main crawling logic
 * Do NOT create monolithic files. Follow the pattern.
 */

export * from "./types.ts";
export { PORTAL_CONFIGS, getPortalConfig, getPortalName } from "./portal-configs.ts";
export { fetchWithRetry, rateLimiter, FetchError } from "./fetcher.ts";
export { parseArticleLinks, parseArticle } from "./parser.ts";
export {
  generateContentHash,
  generateUrlHash,
  isArticleDuplicate,
} from "./deduplicator.ts";
export { crawlAllPortals, crawlPortal } from "./orchestrator.ts";
