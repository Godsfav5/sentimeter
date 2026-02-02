/**
 * Fundamental Data Fetcher
 *
 * Fetches and transforms company fundamental data from Yahoo Finance.
 * Updated for yahoo-finance2 v3 API.
 */

import type { StockFundamentals, FetchResult } from "./types.ts";
import { fromYahooTicker } from "./types.ts";
import { fetchQuoteSummary, type YahooQuoteSummaryData } from "./yahoo-client.ts";
import { upsertStockFundamental } from "../database/queries.ts";

/**
 * Fetch fundamental data for a stock
 */
export async function fetchFundamentals(
  ticker: string
): Promise<FetchResult<StockFundamentals>> {
  const summaryResult = await fetchQuoteSummary(ticker);

  if (!summaryResult.success || !summaryResult.data) {
    return {
      success: false,
      data: null,
      error: summaryResult.error ?? "Failed to fetch summary",
    };
  }

  const summary = summaryResult.data;
  const fundamentals = transformToFundamentals(ticker, summary);

  // Cache in database
  cacheFundamentals(fundamentals);

  return { success: true, data: fundamentals, error: null };
}

/**
 * Helper to extract raw value from Yahoo Finance v3 response
 */
function getRaw(obj: { raw?: number } | number | undefined | null): number | null {
  if (obj == null) return null;
  if (typeof obj === "number") return obj;
  return obj.raw ?? null;
}

/**
 * Transform Yahoo Finance v3 data to our StockFundamentals type
 */
function transformToFundamentals(
  ticker: string,
  summary: YahooQuoteSummaryData
): StockFundamentals {
  const price = summary.price ?? {};
  const profile = summary.summaryProfile ?? {};
  const detail = summary.summaryDetail ?? {};
  const financial = summary.financialData ?? {};
  const keyStats = summary.defaultKeyStatistics ?? {};

  return {
    ticker: fromYahooTicker(ticker).toUpperCase(),
    companyName: price.shortName ?? price.longName ?? ticker,
    sector: profile.sector ?? null,
    industry: profile.industry ?? null,
    marketCap: getRaw(detail.marketCap),
    enterpriseValue: null,

    // Valuation
    peRatio: getRaw(detail.trailingPE),
    forwardPe: null,
    pbRatio: getRaw(detail.priceToBook),
    psRatio: getRaw(keyStats.priceToSalesTrailing12Months),
    pegRatio: null,

    // Profitability
    roe: getRaw(financial.returnOnEquity),
    roa: getRaw(financial.returnOnAssets),
    profitMargin: getRaw(financial.profitMargins),
    operatingMargin: null,

    // Financial health
    debtToEquity: getRaw(financial.debtToEquity),
    currentRatio: getRaw(financial.currentRatio),
    quickRatio: null,

    // Per share
    eps: null,
    bookValue: null,
    revenuePerShare: null,

    // Dividends
    dividendYield: getRaw(detail.dividendYield),
    dividendRate: null,
    payoutRatio: null,

    // Growth
    revenueGrowth: getRaw(financial.revenueGrowth),
    earningsGrowth: getRaw(financial.earningsGrowth),

    // Shares
    sharesOutstanding: null,
    floatShares: null,

    lastUpdated: new Date(),
  };
}

/**
 * Cache fundamentals in database
 */
function cacheFundamentals(fundamentals: StockFundamentals): void {
  upsertStockFundamental({
    ticker: fundamentals.ticker,
    companyName: fundamentals.companyName,
    sector: fundamentals.sector,
    marketCap: fundamentals.marketCap,
    peRatio: fundamentals.peRatio,
    pbRatio: fundamentals.pbRatio,
    roe: fundamentals.roe,
    debtToEquity: fundamentals.debtToEquity,
    dividendYield: fundamentals.dividendYield,
  });
}

/**
 * Fetch fundamentals for multiple tickers
 */
export async function fetchMultipleFundamentals(
  tickers: string[]
): Promise<Map<string, FetchResult<StockFundamentals>>> {
  const results = new Map<string, FetchResult<StockFundamentals>>();

  // Process sequentially to avoid rate limiting
  for (const ticker of tickers) {
    const result = await fetchFundamentals(ticker);
    results.set(ticker.toUpperCase(), result);

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return results;
}
