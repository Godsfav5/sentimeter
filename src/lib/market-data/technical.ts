/**
 * Technical Data Fetcher
 *
 * Fetches price history and calculates technical indicators.
 * Updated for yahoo-finance2 v3 chart API.
 */

import type { PriceBar, TechnicalSummary, StockQuote, FetchResult } from "./types.ts";
import { fromYahooTicker } from "./types.ts";
import { fetchHistorical, fetchQuote, type YahooChartQuote } from "./yahoo-client.ts";
import { insertPriceHistoryBatch } from "../database/queries.ts";
import type { PriceHistoryInsert } from "../database/types.ts";

/**
 * Fetch price history for a stock (v3 chart API)
 */
export async function fetchPriceHistory(
  ticker: string,
  period: "1mo" | "3mo" | "6mo" | "1y" = "3mo"
): Promise<FetchResult<PriceBar[]>> {
  const historyResult = await fetchHistorical(ticker, period);

  if (!historyResult.success || !historyResult.data) {
    return {
      success: false,
      data: null,
      error: historyResult.error ?? "Failed to fetch history",
    };
  }

  // v3 chart API returns { quotes: [...] } structure
  const chartData = historyResult.data;
  const quotes = chartData.quotes;

  if (!quotes || quotes.length === 0) {
    return {
      success: false,
      data: null,
      error: "No price data available",
    };
  }

  const priceBars: PriceBar[] = quotes
    .filter((row): row is typeof row & { date: Date; open: number; high: number; low: number; close: number; volume: number } =>
      row.date != null && row.open != null && row.close != null
    )
    .map((row) => ({
      date: formatDate(row.date),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
      adjustedClose: row.adjclose ?? row.close,
    }));

  // Cache in database
  cachePriceHistory(ticker, priceBars);

  return { success: true, data: priceBars, error: null };
}

/**
 * Fetch current quote for a stock
 */
export async function fetchCurrentQuote(
  ticker: string
): Promise<FetchResult<StockQuote>> {
  const quoteResult = await fetchQuote(ticker);

  if (!quoteResult.success || !quoteResult.data) {
    return {
      success: false,
      data: null,
      error: quoteResult.error ?? "Failed to fetch quote",
    };
  }

  const quote = quoteResult.data;

  const stockQuote: StockQuote = {
    ticker: fromYahooTicker(ticker).toUpperCase(),
    price: quote.regularMarketPrice ?? 0,
    open: quote.regularMarketOpen ?? 0,
    high: quote.regularMarketDayHigh ?? 0,
    low: quote.regularMarketDayLow ?? 0,
    previousClose: quote.regularMarketPreviousClose ?? 0,
    volume: quote.regularMarketVolume ?? 0,
    change: quote.regularMarketChange ?? 0,
    changePercent: quote.regularMarketChangePercent ?? 0,
    marketState: mapMarketState(quote.marketState),
    lastUpdated: new Date(),
  };

  return { success: true, data: stockQuote, error: null };
}

/**
 * Calculate technical summary from price history
 */
export function calculateTechnicalSummary(
  ticker: string,
  priceHistory: PriceBar[],
  currentPrice: number
): TechnicalSummary {
  if (priceHistory.length === 0) {
    return getEmptyTechnicalSummary(ticker, currentPrice);
  }

  const closes = priceHistory.map((p) => p.close);
  const highs = priceHistory.map((p) => p.high);
  const lows = priceHistory.map((p) => p.low);
  const volumes = priceHistory.map((p) => p.volume);

  // Price levels
  const high3Month = Math.max(...highs);
  const low3Month = Math.min(...lows);

  // For 52-week, we use available data (may be less than 52 weeks)
  const high52Week = high3Month; // Will be same if only 3 months data
  const low52Week = low3Month;

  // Moving averages
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);

  // Trend detection
  const { trend, trendStrength } = detectTrend(closes, sma20, sma50);

  // Support/Resistance levels
  const supports = findSupportLevels(lows, currentPrice);
  const resistances = findResistanceLevels(highs, currentPrice);

  // ATR (14-period)
  const atr14 = calculateATR(highs, lows, closes, 14);

  // Volatility
  const volatilityPercent = atr14 ? (atr14 / currentPrice) * 100 : 0;

  // Volume analysis
  const avgVolume20 = calculateSMA(volumes, 20) ?? 0;
  const lastVolume = volumes[volumes.length - 1] ?? 0;
  const volumeRatio = avgVolume20 > 0 ? lastVolume / avgVolume20 : 1;

  return {
    ticker: fromYahooTicker(ticker).toUpperCase(),
    currentPrice,
    high52Week,
    low52Week,
    high3Month,
    low3Month,
    sma20,
    sma50,
    sma200,
    trend,
    trendStrength,
    supports,
    resistances,
    atr14,
    volatilityPercent,
    avgVolume20,
    volumeRatio,
  };
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(values: number[], period: number): number | null {
  if (values.length < period) return null;

  const slice = values.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculate Average True Range
 */
function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number
): number | null {
  if (highs.length < period + 1) return null;

  const trueRanges: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    const high = highs[i] ?? 0;
    const low = lows[i] ?? 0;
    const prevClose = closes[i - 1] ?? 0;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  return calculateSMA(trueRanges, period);
}

/**
 * Detect trend direction and strength
 */
function detectTrend(
  closes: number[],
  sma20: number | null,
  sma50: number | null
): { trend: "BULLISH" | "BEARISH" | "SIDEWAYS"; trendStrength: number } {
  if (closes.length < 20) {
    return { trend: "SIDEWAYS", trendStrength: 50 };
  }

  const currentPrice = closes[closes.length - 1] ?? 0;
  const price20DaysAgo = closes[closes.length - 20] ?? currentPrice;

  const priceChange = ((currentPrice - price20DaysAgo) / price20DaysAgo) * 100;

  let trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
  let trendStrength: number;

  if (priceChange > 5) {
    trend = "BULLISH";
    trendStrength = Math.min(50 + priceChange * 2, 100);
  } else if (priceChange < -5) {
    trend = "BEARISH";
    trendStrength = Math.min(50 + Math.abs(priceChange) * 2, 100);
  } else {
    trend = "SIDEWAYS";
    trendStrength = 50;
  }

  // Adjust based on MA alignment
  if (sma20 && sma50 && currentPrice > sma20 && sma20 > sma50) {
    if (trend !== "BULLISH") trend = "BULLISH";
    trendStrength = Math.min(trendStrength + 10, 100);
  } else if (sma20 && sma50 && currentPrice < sma20 && sma20 < sma50) {
    if (trend !== "BEARISH") trend = "BEARISH";
    trendStrength = Math.min(trendStrength + 10, 100);
  }

  return { trend, trendStrength };
}

/**
 * Find support levels from price lows
 */
function findSupportLevels(lows: number[], currentPrice: number): number[] {
  const belowPrice = lows.filter((l) => l < currentPrice);

  if (belowPrice.length === 0) return [];

  // Find local minimums
  const sorted = [...new Set(belowPrice)].sort((a, b) => b - a);

  // Take top 3 closest supports
  return sorted.slice(0, 3);
}

/**
 * Find resistance levels from price highs
 */
function findResistanceLevels(highs: number[], currentPrice: number): number[] {
  const abovePrice = highs.filter((h) => h > currentPrice);

  if (abovePrice.length === 0) return [];

  // Find local maximums
  const sorted = [...new Set(abovePrice)].sort((a, b) => a - b);

  // Take top 3 closest resistances
  return sorted.slice(0, 3);
}

/**
 * Get empty technical summary for error cases
 */
function getEmptyTechnicalSummary(
  ticker: string,
  currentPrice: number
): TechnicalSummary {
  return {
    ticker: fromYahooTicker(ticker).toUpperCase(),
    currentPrice,
    high52Week: currentPrice,
    low52Week: currentPrice,
    high3Month: currentPrice,
    low3Month: currentPrice,
    sma20: null,
    sma50: null,
    sma200: null,
    trend: "SIDEWAYS",
    trendStrength: 50,
    supports: [],
    resistances: [],
    atr14: null,
    volatilityPercent: 0,
    avgVolume20: 0,
    volumeRatio: 1,
  };
}

/**
 * Cache price history in database
 */
function cachePriceHistory(ticker: string, priceBars: PriceBar[]): void {
  const cleanTicker = fromYahooTicker(ticker).toUpperCase();

  const inserts: PriceHistoryInsert[] = priceBars.map((bar) => ({
    ticker: cleanTicker,
    date: bar.date,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  }));

  insertPriceHistoryBatch(inserts);
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Map Yahoo market state to our type
 */
function mapMarketState(
  state: string | undefined
): "PRE" | "REGULAR" | "POST" | "CLOSED" {
  switch (state) {
    case "PRE":
      return "PRE";
    case "REGULAR":
      return "REGULAR";
    case "POST":
    case "POSTPOST":
      return "POST";
    default:
      return "CLOSED";
  }
}
