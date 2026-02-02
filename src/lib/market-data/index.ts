/**
 * Market Data Module
 *
 * ⚠️ AI AGENTS: This module is split into submodules:
 * - types.ts: Type definitions for quotes, fundamentals, technicals
 * - yahoo-client.ts: Yahoo Finance API wrapper
 * - fundamental.ts: Company fundamental data fetching
 * - technical.ts: Price history and technical analysis
 * Do NOT create monolithic files. Follow the pattern.
 */

export * from "./types.ts";
export { fetchQuote, fetchQuoteSummary, fetchHistorical } from "./yahoo-client.ts";
export { fetchFundamentals, fetchMultipleFundamentals } from "./fundamental.ts";
export {
  fetchPriceHistory,
  fetchCurrentQuote,
  calculateTechnicalSummary,
} from "./technical.ts";

import type { StockData, FetchResult } from "./types.ts";
import { fetchFundamentals } from "./fundamental.ts";
import { fetchPriceHistory, fetchCurrentQuote, calculateTechnicalSummary } from "./technical.ts";

/**
 * Fetch all stock data for analysis
 */
export async function fetchStockData(
  ticker: string
): Promise<FetchResult<StockData>> {
  // Fetch all data in parallel
  const [quoteResult, fundamentalsResult, historyResult] = await Promise.all([
    fetchCurrentQuote(ticker),
    fetchFundamentals(ticker),
    fetchPriceHistory(ticker, "3mo"),
  ]);

  // Check for failures
  if (!quoteResult.success || !quoteResult.data) {
    return {
      success: false,
      data: null,
      error: `Failed to fetch quote: ${quoteResult.error}`,
    };
  }

  if (!fundamentalsResult.success || !fundamentalsResult.data) {
    return {
      success: false,
      data: null,
      error: `Failed to fetch fundamentals: ${fundamentalsResult.error}`,
    };
  }

  if (!historyResult.success || !historyResult.data) {
    return {
      success: false,
      data: null,
      error: `Failed to fetch history: ${historyResult.error}`,
    };
  }

  // Calculate technical summary
  const technical = calculateTechnicalSummary(
    ticker,
    historyResult.data,
    quoteResult.data.price
  );

  return {
    success: true,
    data: {
      quote: quoteResult.data,
      fundamentals: fundamentalsResult.data,
      priceHistory: historyResult.data,
      technical,
    },
    error: null,
  };
}

/**
 * Fetch stock data for multiple tickers
 */
export async function fetchMultipleStockData(
  tickers: string[]
): Promise<Map<string, FetchResult<StockData>>> {
  const results = new Map<string, FetchResult<StockData>>();

  // Process sequentially to avoid rate limiting
  for (const ticker of tickers) {
    console.log(`📊 Fetching data for ${ticker}...`);
    const result = await fetchStockData(ticker);
    results.set(ticker.toUpperCase(), result);

    // Delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}
