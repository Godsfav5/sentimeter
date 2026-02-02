/**
 * Ticker Extractor
 *
 * Uses Gemini to extract stock tickers from news articles.
 */

import { generateContent } from "./llm-client.ts";
import type {
  NewsArticleInput,
  ExtractedTicker,
  TickerExtractionResult,
  TickerExtractionResponse,
} from "./types.ts";

const SYSTEM_INSTRUCTION = `You are a financial news analyst. Extract Indonesian stock tickers (4-letter codes like BBCA, TLKM).
Rate sentiment -1 to 1, relevance 0 to 1. Respond with ONLY this JSON format:
{"tickers":[{"code":"XXXX","sentiment":0.5,"relevance":0.8,"reason":"brief"}]}`;

const BATCH_SIZE = 10; // Process 10 articles at a time

/**
 * Extract tickers from a batch of news articles
 */
export async function extractTickersFromNews(
  articles: NewsArticleInput[]
): Promise<TickerExtractionResult> {
  const startTime = Date.now();

  if (articles.length === 0) {
    return {
      tickers: [],
      articlesAnalyzed: 0,
      processingTimeMs: 0,
    };
  }

  const allTickers: ExtractedTicker[] = [];

  // Process in batches
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    console.log(`   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(articles.length / BATCH_SIZE)}...`);

    const batchTickers = await extractFromBatch(batch);
    allTickers.push(...batchTickers);

    // Small delay between batches
    if (i + BATCH_SIZE < articles.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Deduplicate by ticker, keeping highest relevance
  const deduped = deduplicateTickers(allTickers);

  return {
    tickers: deduped,
    articlesAnalyzed: articles.length,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Extract tickers from a single batch of articles
 */
async function extractFromBatch(articles: NewsArticleInput[]): Promise<ExtractedTicker[]> {
  const articlesText = articles
    .map((a, i) => `[${i + 1}] ${a.title}${a.content ? ": " + a.content.slice(0, 100) : ""}`)
    .join("\n");

  const prompt = `Extract Indonesian stock tickers from these news headlines:\n\n${articlesText}\n\nRespond with JSON only.`;

  const response = await generateContent<TickerExtractionResponse>(prompt, SYSTEM_INSTRUCTION);

  if (!response.success || !response.data?.tickers) {
    return [];
  }

  return response.data.tickers
    .filter((t) => isValidTicker(t.code))
    .map((t) => ({
      ticker: t.code.toUpperCase(),
      sentiment: clamp(t.sentiment, -1, 1),
      relevance: clamp(t.relevance, 0, 1),
      reason: t.reason,
    }));
}

/**
 * Validate Indonesian stock ticker format
 */
function isValidTicker(code: string): boolean {
  if (!code || typeof code !== "string") return false;

  const cleaned = code.toUpperCase().trim();

  // Must be 4 letters
  if (!/^[A-Z]{4}$/.test(cleaned)) return false;

  // Exclude common non-ticker words
  const excludeList = ["IHSG", "JKSE", "NEWS", "DATA", "INFO"];
  if (excludeList.includes(cleaned)) return false;

  return true;
}

/**
 * Deduplicate tickers, keeping highest relevance for each
 */
function deduplicateTickers(tickers: ExtractedTicker[]): ExtractedTicker[] {
  const tickerMap = new Map<string, ExtractedTicker>();

  for (const ticker of tickers) {
    const existing = tickerMap.get(ticker.ticker);
    if (!existing || ticker.relevance > existing.relevance) {
      tickerMap.set(ticker.ticker, ticker);
    }
  }

  return Array.from(tickerMap.values()).sort(
    (a, b) => b.relevance - a.relevance
  );
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
