/**
 * Crawler Orchestrator
 *
 * Coordinates crawling across all news portals.
 */

import type { NewsPortalConfig, RawArticle, CrawlResult, CrawlSummary } from "./types.ts";
import { PORTAL_CONFIGS } from "./portal-configs.ts";
import { fetchWithRetry, rateLimiter, RateLimiter, sleep } from "./fetcher.ts";
import { parseArticleLinks, parseArticle } from "./parser.ts";
import { generateContentHash, isArticleDuplicate } from "./deduplicator.ts";
import { insertNewsArticle } from "../database/queries.ts";
import type { NewsArticleInsert } from "../database/types.ts";
import { logEmitter } from "../../api/log-emitter.ts";

const MAX_ARTICLES_PER_PORTAL = 15;
const MAX_CONCURRENT_PORTALS = 3;

/**
 * Crawl all configured news portals
 */
export async function crawlAllPortals(): Promise<CrawlSummary> {
  const startTime = Date.now();
  const results: CrawlResult[] = [];

  // Process portals in batches to avoid overwhelming
  const batches = chunkArray(PORTAL_CONFIGS, MAX_CONCURRENT_PORTALS);

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map((config) => crawlPortal(config))
    );
    results.push(...batchResults);

    // Small delay between batches
    await sleep(2000);
  }

  const successfulPortals = results.filter((r) => r.success).length;
  const totalArticlesFound = results.reduce((sum, r) => sum + r.articlesFound, 0);
  const totalNewArticles = results.reduce((sum, r) => sum + r.newArticles, 0);

  return {
    totalPortals: PORTAL_CONFIGS.length,
    successfulPortals,
    failedPortals: PORTAL_CONFIGS.length - successfulPortals,
    totalArticlesFound,
    totalNewArticles,
    totalDurationMs: Date.now() - startTime,
    results,
  };
}

/**
 * Crawl a single news portal
 */
export async function crawlPortal(config: NewsPortalConfig): Promise<CrawlResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let articlesFound = 0;
  let articlesCrawled = 0;
  let newArticles = 0;

  try {
    logEmitter.info(`Crawling ${config.name}...`);

    // Fetch listing page
    const domain = RateLimiter.getDomain(config.baseUrl);
    await rateLimiter.waitForDomain(domain, config.delayMs);

    const listingHtml = await fetchWithRetry(config.baseUrl);
    const articleUrls = parseArticleLinks(listingHtml, config);
    articlesFound = articleUrls.length;

    logEmitter.info(`Found ${articlesFound} articles on ${config.name}`);

    // Limit articles per portal
    const urlsToProcess = articleUrls.slice(0, MAX_ARTICLES_PER_PORTAL);

    // Fetch and parse each article
    for (const url of urlsToProcess) {
      try {
        await rateLimiter.waitForDomain(domain, config.delayMs);

        const articleHtml = await fetchWithRetry(url);
        const article = parseArticle(articleHtml, url, config);

        if (!article || !article.title) {
          continue;
        }

        articlesCrawled++;

        // Check for duplicates
        const contentHash = generateContentHash(article.title, article.content);
        if (isArticleDuplicate(contentHash)) {
          continue;
        }

        // Save to database
        const articleInsert: NewsArticleInsert = {
          url: article.url,
          title: article.title,
          content: article.content,
          portal: article.portal,
          publishedAt: article.publishedAt,
          contentHash,
        };

        insertNewsArticle(articleInsert);
        newArticles++;
      } catch (articleError) {
        const errorMsg =
          articleError instanceof Error ? articleError.message : String(articleError);
        errors.push(`Article error (${url}): ${errorMsg}`);
      }
    }

    logEmitter.success(`${config.name}: ${newArticles} new articles saved`);

    return {
      portal: config.name,
      success: true,
      articlesFound,
      articlesCrawled,
      newArticles,
      errors,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logEmitter.error(`${config.name}: ${errorMsg}`);
    errors.push(`Portal error: ${errorMsg}`);

    return {
      portal: config.name,
      success: false,
      articlesFound,
      articlesCrawled,
      newArticles,
      errors,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
