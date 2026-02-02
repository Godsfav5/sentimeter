/**
 * Crawler Portal Tests
 *
 * Tests each news portal to verify:
 * 1. Listing page is accessible
 * 2. Article links can be extracted
 * 3. At least one article can be parsed
 */

import { test, expect, describe } from "bun:test";
import { PORTAL_CONFIGS } from "./portal-configs.ts";
import { fetchWithRetry } from "./fetcher.ts";
import { parseArticleLinks, parseArticle } from "./parser.ts";
import type { NewsPortalConfig } from "./types.ts";

const TIMEOUT_MS = 30000;

interface PortalTestResult {
  portal: string;
  listingAccessible: boolean;
  articlesFound: number;
  articleParseable: boolean;
  sampleTitle: string | null;
  error: string | null;
}

/**
 * Test a single portal configuration
 */
async function testPortal(config: NewsPortalConfig): Promise<PortalTestResult> {
  const result: PortalTestResult = {
    portal: config.name,
    listingAccessible: false,
    articlesFound: 0,
    articleParseable: false,
    sampleTitle: null,
    error: null,
  };

  try {
    // Step 1: Fetch listing page
    const listingHtml = await fetchWithRetry(config.baseUrl, {
      timeout: 15000,
      retries: 1,
    });

    result.listingAccessible = true;

    // Step 2: Extract article links
    const links = parseArticleLinks(listingHtml, config);
    result.articlesFound = links.length;

    if (links.length === 0) {
      result.error = "No article links found with current selector";
      return result;
    }

    // Step 3: Try to parse articles (try up to 3 in case some are 404)
    const linksToTry = links.slice(0, 3);

    for (const link of linksToTry) {
      try {
        const articleHtml = await fetchWithRetry(link, {
          timeout: 15000,
          retries: 1,
        });

        // Skip if it's a 404 page (check title/body indicators)
        const is404Page =
          articleHtml.includes("p404__") ||
          articleHtml.includes('class="not-found"') ||
          articleHtml.includes('id="not-found"') ||
          articleHtml.includes("<title>404") ||
          articleHtml.includes("Halaman tidak ditemukan");
        if (is404Page) {
          continue;
        }

        const article = parseArticle(articleHtml, link, config);

        if (article && article.title) {
          result.articleParseable = true;
          result.sampleTitle = article.title.slice(0, 80);
          break;
        }
      } catch {
        // Try next article
        continue;
      }
    }

    if (!result.articleParseable) {
      result.error = "All tested articles failed title extraction";
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

describe("Crawler Portal Tests", () => {
  // Individual portal tests
  for (const config of PORTAL_CONFIGS) {
    test(
      `${config.name} - listing and article parsing`,
      async () => {
        const result = await testPortal(config);

        console.log(`\n--- ${result.portal} ---`);
        console.log(`  Listing accessible: ${result.listingAccessible}`);
        console.log(`  Articles found: ${result.articlesFound}`);
        console.log(`  Article parseable: ${result.articleParseable}`);
        if (result.sampleTitle) {
          console.log(`  Sample title: "${result.sampleTitle}..."`);
        }
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }

        // Assertions
        expect(result.listingAccessible).toBe(true);
        expect(result.articlesFound).toBeGreaterThan(0);
        expect(result.articleParseable).toBe(true);
      },
      TIMEOUT_MS
    );
  }
});

describe("Crawler Portal Summary", () => {
  test(
    "all portals health check",
    async () => {
      const results: PortalTestResult[] = [];

      for (const config of PORTAL_CONFIGS) {
        const result = await testPortal(config);
        results.push(result);

        // Add delay between portals to avoid rate limiting
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Print summary
      console.log("\n" + "=".repeat(70));
      console.log("CRAWLER PORTAL HEALTH CHECK SUMMARY");
      console.log("=".repeat(70));

      const working = results.filter((r) => r.articleParseable);
      const partial = results.filter(
        (r) => r.listingAccessible && !r.articleParseable
      );
      const failed = results.filter((r) => !r.listingAccessible);

      console.log(`\n✅ WORKING (${working.length}/${results.length}):`);
      for (const r of working) {
        console.log(`   ${r.portal}: ${r.articlesFound} articles`);
      }

      if (partial.length > 0) {
        console.log(`\n⚠️  PARTIAL (${partial.length}/${results.length}):`);
        for (const r of partial) {
          console.log(`   ${r.portal}: ${r.error}`);
        }
      }

      if (failed.length > 0) {
        console.log(`\n❌ FAILED (${failed.length}/${results.length}):`);
        for (const r of failed) {
          console.log(`   ${r.portal}: ${r.error}`);
        }
      }

      console.log("\n" + "=".repeat(70));

      // At least 50% of portals should work
      const workingPercentage = (working.length / results.length) * 100;
      console.log(
        `Overall health: ${workingPercentage.toFixed(1)}% portals working`
      );

      expect(workingPercentage).toBeGreaterThanOrEqual(50);
    },
    TIMEOUT_MS * PORTAL_CONFIGS.length
  );
});
