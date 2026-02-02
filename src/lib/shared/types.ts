/**
 * Shared Types
 *
 * Common types used across multiple modules.
 * These are the "public" types exposed to the API and frontend.
 */

// ============================================================================
// Stock Recommendation (API Response)
// ============================================================================

export interface StockRecommendation {
  ticker: string;
  companyName: string;
  sector: string | null;

  // Current market data
  currentPrice: number;
  priceChange: number;
  priceChangePct: number;

  // Recommendation action
  action: "BUY" | "HOLD" | "AVOID";

  // Price levels
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  maxHoldDays: number;

  // Risk/Reward metrics
  riskPercent: number; // (entry - SL) / entry * 100
  rewardPercent: number; // (target - entry) / entry * 100
  riskRewardRatio: number; // reward / risk

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

  // Status tracking
  status: RecommendationStatusType;
  statusMessage: string;
  daysActive: number;

  // Dates
  recommendationDate: string;
  entryHitDate: string | null;
  exitDate: string | null;

  // P/L tracking
  exitPrice: number | null;
  profitLossPct: number | null;
}

export type RecommendationStatusType =
  | "pending"
  | "entry_hit"
  | "target_hit"
  | "sl_hit"
  | "expired";

// ============================================================================
// Active Position (for tracking previous picks)
// ============================================================================

export interface ActivePosition {
  ticker: string;
  companyName: string;
  recommendationDate: string;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  targetPrice: number;
  status: RecommendationStatusType;
  unrealizedPnlPct: number;
  daysHeld: number;
  suggestedAction: string;
}

// ============================================================================
// Daily Summary
// ============================================================================

export interface DailySummary {
  date: string;
  schedule: "morning" | "evening";
  newPicks: number;
  activePositions: number;
  closedToday: number;
  winRate: number | null;
  avgReturn: number | null;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface RecommendationsResponse {
  date: string;
  generatedAt: string;
  schedule: "morning" | "evening";
  recommendations: StockRecommendation[];
  activePositions: ActivePosition[];
  summary: DailySummary;
}

export interface HistoryResponse {
  recommendations: StockRecommendation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalRecommendations: number;
    winRate: number;
    avgReturn: number;
    bestPick: { ticker: string; returnPct: number } | null;
    worstPick: { ticker: string; returnPct: number } | null;
  };
}

// ============================================================================
// Job Types
// ============================================================================

export type JobSchedule = "morning" | "evening";

export interface JobConfig {
  schedule: JobSchedule;
  /** Morning job runs before market open (e.g., 8:00 WIB) */
  /** Evening job runs after market close (e.g., 17:00 WIB) */
  description: string;
}

export const JOB_CONFIGS: Record<JobSchedule, JobConfig> = {
  morning: {
    schedule: "morning",
    description: "Pre-market analysis with overnight news",
  },
  evening: {
    schedule: "evening",
    description: "Post-market analysis with full day news and price action",
  },
};

// ============================================================================
// News Types
// ============================================================================

export interface CrawledArticle {
  url: string;
  title: string;
  content: string | null;
  portal: string;
  publishedAt: Date | null;
}

export interface ExtractedTicker {
  ticker: string;
  sentiment: number; // -1 to 1
  relevance: number; // 0 to 1
  reason: string;
}

// ============================================================================
// Market Data Types
// ============================================================================

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
}

export interface StockFundamentals {
  ticker: string;
  companyName: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  roe: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  eps: number | null;
  bookValue: number | null;
}

export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================================================
// LLM Analysis Types
// ============================================================================

export interface TickerExtractionResult {
  tickers: ExtractedTicker[];
  articlesAnalyzed: number;
}

export interface StockAnalysisInput {
  ticker: string;
  fundamentals: StockFundamentals;
  priceHistory: PriceBar[];
  newsMentions: Array<{
    title: string;
    sentiment: number;
    relevance: number;
  }>;
  previousPredictions: ActivePosition[];
}

export interface StockAnalysisResult {
  ticker: string;
  action: "BUY" | "HOLD" | "AVOID";
  confidence: number; // 1-10
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  maxHoldDays: number;
  reasoning: {
    sentiment: string;
    fundamental: string;
    technical: string;
  };
  previousPredictionUpdates: Array<{
    ticker: string;
    action: "HOLD" | "EXIT" | "TAKE_PROFIT";
    reason: string;
  }>;
}
