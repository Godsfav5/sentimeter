/**
 * Market Data Types
 *
 * Type definitions for Yahoo Finance data and market operations.
 */

/**
 * Stock quote with current price data
 */
export interface StockQuote {
  ticker: string;
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  change: number;
  changePercent: number;
  marketState: "PRE" | "REGULAR" | "POST" | "CLOSED";
  lastUpdated: Date;
}

/**
 * Company fundamental data
 */
export interface StockFundamentals {
  ticker: string;
  companyName: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  enterpriseValue: number | null;

  // Valuation ratios
  peRatio: number | null; // Price to Earnings (trailing)
  forwardPe: number | null; // Forward P/E
  pbRatio: number | null; // Price to Book
  psRatio: number | null; // Price to Sales
  pegRatio: number | null; // PEG Ratio

  // Profitability
  roe: number | null; // Return on Equity
  roa: number | null; // Return on Assets
  profitMargin: number | null;
  operatingMargin: number | null;

  // Financial health
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;

  // Per share data
  eps: number | null; // Earnings per share
  bookValue: number | null;
  revenuePerShare: number | null;

  // Dividends
  dividendYield: number | null;
  dividendRate: number | null;
  payoutRatio: number | null;

  // Growth
  revenueGrowth: number | null;
  earningsGrowth: number | null;

  // Shares
  sharesOutstanding: number | null;
  floatShares: number | null;

  lastUpdated: Date;
}

/**
 * OHLCV price bar
 */
export interface PriceBar {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
}

/**
 * Technical analysis summary
 */
export interface TechnicalSummary {
  ticker: string;
  currentPrice: number;

  // Price levels
  high52Week: number;
  low52Week: number;
  high3Month: number;
  low3Month: number;

  // Moving averages
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;

  // Trend
  trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
  trendStrength: number; // 0-100

  // Support/Resistance
  supports: number[];
  resistances: number[];

  // Volatility
  atr14: number | null; // Average True Range
  volatilityPercent: number;

  // Volume
  avgVolume20: number;
  volumeRatio: number; // Current vs average
}

/**
 * Combined stock data for analysis
 */
export interface StockData {
  quote: StockQuote;
  fundamentals: StockFundamentals;
  priceHistory: PriceBar[];
  technical: TechnicalSummary;
}

/**
 * Fetch result wrapper
 */
export interface FetchResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Indonesian stock suffix for Yahoo Finance
 */
export const IHSG_SUFFIX = ".JK";

/**
 * Convert ticker to Yahoo Finance format
 */
export function toYahooTicker(ticker: string): string {
  const cleaned = ticker.toUpperCase().replace(/\.JK$/i, "");
  return `${cleaned}${IHSG_SUFFIX}`;
}

/**
 * Convert Yahoo ticker back to IHSG format
 */
export function fromYahooTicker(yahooTicker: string): string {
  return yahooTicker.toUpperCase().replace(/\.JK$/i, "");
}
