/**
 * Yahoo Finance Client
 *
 * Wrapper around yahoo-finance2 v3 with error handling and caching.
 */

import YahooFinance from "yahoo-finance2";
import type { FetchResult } from "./types.ts";
import { toYahooTicker } from "./types.ts";

// v3 requires instantiation
const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

// Define types based on v3 API structure
export interface YahooQuoteData {
  regularMarketPrice?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketPreviousClose?: number;
  regularMarketVolume?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  marketState?: string;
  shortName?: string;
  longName?: string;
  symbol?: string;
}

export interface YahooChartQuote {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  adjclose?: number | null;
}

export interface YahooChartData {
  quotes: YahooChartQuote[];
  meta?: {
    currency?: string;
    symbol?: string;
    regularMarketPrice?: number;
  };
}

export interface YahooQuoteSummaryData {
  price?: {
    regularMarketPrice?: { raw?: number };
    shortName?: string;
    longName?: string;
  };
  summaryProfile?: {
    sector?: string;
    industry?: string;
  };
  summaryDetail?: {
    marketCap?: { raw?: number };
    trailingPE?: { raw?: number };
    priceToBook?: { raw?: number };
    dividendYield?: { raw?: number };
  };
  financialData?: {
    currentRatio?: { raw?: number };
    debtToEquity?: { raw?: number };
    returnOnEquity?: { raw?: number };
    returnOnAssets?: { raw?: number };
    profitMargins?: { raw?: number };
    revenueGrowth?: { raw?: number };
    earningsGrowth?: { raw?: number };
  };
  defaultKeyStatistics?: {
    priceToSalesTrailing12Months?: { raw?: number };
  };
}

/**
 * Fetch stock quote
 */
export async function fetchQuote(
  ticker: string
): Promise<FetchResult<YahooQuoteData>> {
  const yahooTicker = toYahooTicker(ticker);

  try {
    const quote = await yahooFinance.quote(yahooTicker);
    return { success: true, data: quote as YahooQuoteData, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, data: null, error: message };
  }
}

/**
 * Fetch detailed quote summary (fundamentals)
 */
export async function fetchQuoteSummary(
  ticker: string
): Promise<FetchResult<YahooQuoteSummaryData>> {
  const yahooTicker = toYahooTicker(ticker);

  try {
    const summary = await yahooFinance.quoteSummary(yahooTicker, {
      modules: [
        "price",
        "summaryProfile",
        "summaryDetail",
        "financialData",
        "defaultKeyStatistics",
      ],
    });
    return { success: true, data: summary as YahooQuoteSummaryData, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, data: null, error: message };
  }
}

/**
 * Fetch historical price data using chart API (v3)
 */
export async function fetchHistorical(
  ticker: string,
  period: "1mo" | "3mo" | "6mo" | "1y" = "3mo"
): Promise<FetchResult<YahooChartData>> {
  const yahooTicker = toYahooTicker(ticker);

  try {
    const chart = await yahooFinance.chart(yahooTicker, {
      period1: getStartDate(period),
      period2: new Date(),
      interval: "1d",
    });
    return { success: true, data: chart as YahooChartData, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, data: null, error: message };
  }
}

/**
 * Fetch multiple quotes at once
 */
export async function fetchMultipleQuotes(
  tickers: string[]
): Promise<Map<string, FetchResult<YahooQuoteData>>> {
  const results = new Map<string, FetchResult<YahooQuoteData>>();

  const batchSize = 5;
  const batches = chunkArray(tickers, batchSize);

  for (const batch of batches) {
    const promises = batch.map(async (ticker) => {
      const result = await fetchQuote(ticker);
      results.set(ticker.toUpperCase(), result);
    });

    await Promise.all(promises);

    if (batches.indexOf(batch) < batches.length - 1) {
      await sleep(500);
    }
  }

  return results;
}

/**
 * Calculate start date from period string
 */
function getStartDate(period: "1mo" | "3mo" | "6mo" | "1y"): Date {
  const now = new Date();

  switch (period) {
    case "1mo":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3mo":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "6mo":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
