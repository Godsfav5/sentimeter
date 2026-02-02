/**
 * API Types
 *
 * Type definitions for API requests and responses.
 */

import type { TrackedPrediction, PredictionSummary } from "../lib/prediction-tracker/types.ts";

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  timestamp: string;
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(error: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Recommendations Endpoint
// ============================================================================

export interface RecommendationItem {
  ticker: string;
  companyName: string;
  sector: string | null;
  action: "BUY" | "HOLD" | "AVOID";

  // Current price data
  currentPrice: number;
  priceChange: number;
  priceChangePct: number;

  // Price targets
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  maxHoldDays: number;

  // Risk/Reward
  riskPercent: number;
  rewardPercent: number;
  riskRewardRatio: number;

  // Scores
  sentimentScore: number;
  fundamentalScore: number;
  technicalScore: number;
  overallScore: number;

  // Analysis
  newsSummary: string;
  fundamentalSummary: string;
  technicalSummary: string;
  analysisSummary: string;

  // Status
  status: string;
  statusMessage: string;
  recommendationDate: string;
}

export interface ActivePositionItem {
  ticker: string;
  companyName: string;
  recommendationDate: string;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  targetPrice: number;
  status: string;
  unrealizedPnlPct: number | null;
  daysHeld: number;
  suggestedAction: string;
}

export interface RecommendationsResponse {
  date: string;
  schedule: "morning" | "evening";
  generatedAt: string;
  recommendations: RecommendationItem[];
  activePositions: ActivePositionItem[];
  summary: PredictionSummary;
}

// ============================================================================
// History Endpoint
// ============================================================================

export interface HistoryParams {
  page?: number;
  pageSize?: number;
  ticker?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface HistoryItem {
  ticker: string;
  companyName: string;
  recommendationDate: string;
  action: string;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  status: string;
  exitDate: string | null;
  exitPrice: number | null;
  profitLossPct: number | null;
  overallScore: number;
}

export interface HistoryStats {
  totalRecommendations: number;
  winRate: number | null;
  avgReturn: number | null;
  bestPick: { ticker: string; returnPct: number } | null;
  worstPick: { ticker: string; returnPct: number } | null;
}

export interface HistoryResponse {
  items: HistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: HistoryStats;
}

// ============================================================================
// Refresh Endpoint
// ============================================================================

export interface RefreshResponse {
  triggered: boolean;
  schedule: "morning" | "evening";
  jobId: number | null;
  message: string;
}
