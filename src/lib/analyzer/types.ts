/**
 * Analyzer Types
 *
 * Type definitions for LLM-based analysis.
 */

// ============================================================================
// Ticker Extraction
// ============================================================================

export interface ExtractedTicker {
  ticker: string;
  sentiment: number; // -1 (bearish) to 1 (bullish)
  relevance: number; // 0 to 1
  reason: string;
}

export interface TickerExtractionResult {
  tickers: ExtractedTicker[];
  articlesAnalyzed: number;
  processingTimeMs: number;
}

export interface NewsArticleInput {
  title: string;
  content: string | null;
  portal: string;
  publishedAt: Date | null;
}

// ============================================================================
// Stock Analysis
// ============================================================================

export interface StockAnalysisInput {
  ticker: string;
  companyName: string;
  sector: string | null;

  // Current market data
  currentPrice: number;
  priceChange: number;
  priceChangePct: number;

  // Fundamentals
  peRatio: number | null;
  pbRatio: number | null;
  roe: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  marketCap: number | null;

  // Technical
  trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
  sma20: number | null;
  sma50: number | null;
  high3Month: number;
  low3Month: number;
  supports: number[];
  resistances: number[];
  volatilityPercent: number;

  // News sentiment
  newsMentions: Array<{
    title: string;
    sentiment: number;
    relevance: number;
  }>;

  // Previous predictions still active
  activePredictions: ActivePrediction[];
}

export interface ActivePrediction {
  ticker: string;
  recommendationDate: string;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  currentPrice: number;
  status: "pending" | "entry_hit";
  daysActive: number;
}

export interface StockAnalysisResult {
  ticker: string;
  action: "BUY" | "HOLD" | "AVOID";
  confidence: number; // 1-10

  // Price targets
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  maxHoldDays: number;

  // Scores (0-100)
  sentimentScore: number;
  fundamentalScore: number;
  technicalScore: number;
  overallScore: number;

  // Analysis summaries
  newsSummary: string;
  fundamentalSummary: string;
  technicalSummary: string;
  analysisSummary: string;

  // Updates for previous predictions
  predictionUpdates: PredictionUpdate[];
}

export interface PredictionUpdate {
  ticker: string;
  action: "HOLD" | "EXIT" | "TAKE_PROFIT" | "ADD";
  reason: string;
  newStopLoss?: number;
  newTarget?: number;
}

// ============================================================================
// LLM Response Schemas
// ============================================================================

export interface TickerExtractionResponse {
  tickers: Array<{
    code: string;
    sentiment: number;
    relevance: number;
    reason: string;
  }>;
}

export interface StockAnalysisResponse {
  action: "BUY" | "HOLD" | "AVOID";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  maxHoldDays: number;
  scores: {
    sentiment: number;
    fundamental: number;
    technical: number;
    overall: number;
  };
  reasoning: {
    news: string;
    fundamental: string;
    technical: string;
    summary: string;
  };
  previousPredictionUpdates: Array<{
    ticker: string;
    action: "HOLD" | "EXIT" | "TAKE_PROFIT" | "ADD";
    reason: string;
    newStopLoss?: number;
    newTarget?: number;
  }>;
}
