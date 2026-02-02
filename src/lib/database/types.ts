/**
 * Database Types
 *
 * Core type definitions for all database entities.
 * These types map directly to SQLite tables.
 */

// ============================================================================
// News Articles
// ============================================================================

export interface NewsArticle {
  id: number;
  url: string;
  title: string;
  content: string | null;
  portal: string;
  publishedAt: Date | null;
  crawledAt: Date;
  contentHash: string;
}

export interface NewsArticleInsert {
  url: string;
  title: string;
  content?: string | null;
  portal: string;
  publishedAt?: Date | null;
  contentHash: string;
}

// ============================================================================
// News Tickers (extracted from articles)
// ============================================================================

export interface NewsTicker {
  id: number;
  articleId: number;
  ticker: string;
  sentimentScore: number; // -1 to 1
  relevanceScore: number; // 0 to 1
  extractedAt: Date;
}

export interface NewsTickerInsert {
  articleId: number;
  ticker: string;
  sentimentScore: number;
  relevanceScore: number;
}

// ============================================================================
// Stock Recommendations
// ============================================================================

export type RecommendationStatus =
  | "pending" // Waiting for entry price
  | "entry_hit" // Entry price reached, position opened
  | "target_hit" // Target price reached, profit taken
  | "sl_hit" // Stop loss hit, exited with loss
  | "expired"; // Max hold days exceeded

export type RecommendationAction = "BUY" | "HOLD" | "AVOID";

export interface Recommendation {
  id: number;
  ticker: string;
  recommendationDate: string; // YYYY-MM-DD format
  action: RecommendationAction;

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

  // Analysis text
  analysisSummary: string;
  newsSummary: string;
  fundamentalSummary: string;
  technicalSummary: string;

  // Status tracking
  status: RecommendationStatus;
  entryHitDate: string | null;
  exitDate: string | null;
  exitPrice: number | null;
  profitLossPct: number | null;

  createdAt: Date;
}

export interface RecommendationInsert {
  ticker: string;
  recommendationDate: string;
  action: RecommendationAction;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  maxHoldDays: number;
  sentimentScore: number;
  fundamentalScore: number;
  technicalScore: number;
  overallScore: number;
  analysisSummary: string;
  newsSummary: string;
  fundamentalSummary: string;
  technicalSummary: string;
}

// ============================================================================
// Stock Fundamentals Cache
// ============================================================================

export interface StockFundamental {
  ticker: string;
  companyName: string;
  sector: string | null;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  roe: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  updatedAt: Date;
}

export interface StockFundamentalInsert {
  ticker: string;
  companyName: string;
  sector?: string | null;
  marketCap?: number | null;
  peRatio?: number | null;
  pbRatio?: number | null;
  roe?: number | null;
  debtToEquity?: number | null;
  dividendYield?: number | null;
}

// ============================================================================
// Price History
// ============================================================================

export interface PriceHistory {
  id: number;
  ticker: string;
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceHistoryInsert {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================================================
// Job Execution Log
// ============================================================================

export type JobSchedule = "morning" | "evening";
export type JobStatus = "running" | "completed" | "failed";

export interface JobExecution {
  id: number;
  schedule: JobSchedule;
  executionDate: string;
  status: JobStatus;
  articlesProcessed: number;
  tickersExtracted: number;
  recommendationsGenerated: number;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface JobExecutionInsert {
  schedule: JobSchedule;
  executionDate: string;
}
