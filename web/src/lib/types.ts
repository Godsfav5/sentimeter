/**
 * API Types for Sentimeter Frontend
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface RecommendationItem {
  ticker: string;
  companyName: string;
  sector: string | null;
  action: "buy" | "sell";
  currentPrice: number;
  priceChange: number;
  priceChangePct: number;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  maxHoldDays: number;
  riskPercent: number;
  rewardPercent: number;
  riskRewardRatio: number;
  sentimentScore: number;
  fundamentalScore: number;
  technicalScore: number;
  overallScore: number;
  newsSummary: string;
  fundamentalSummary: string;
  technicalSummary: string;
  analysisSummary: string;
  status: string;
  statusMessage: string;
  recommendationDate: string;
}

export interface ActivePositionItem {
  ticker: string;
  companyName: string;
  recommendationDate: string;
  entryPrice: number;
  currentPrice: number | null;
  stopLoss: number;
  targetPrice: number;
  status: string;
  unrealizedPnlPct: number | null;
  daysHeld: number;
  suggestedAction: string;
}

export interface PredictionSummary {
  totalActive: number;
  totalPending: number;
  totalClosed: number;
  winRate: number | null;
  avgReturn: number | null;
}

export interface RecommendationsResponse {
  date: string;
  schedule: "morning" | "evening";
  generatedAt: string;
  recommendations: RecommendationItem[];
  activePositions: ActivePositionItem[];
  summary: PredictionSummary;
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

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HistoryResponse {
  items: HistoryItem[];
  pagination: Pagination;
  stats: HistoryStats;
}

export interface HistoryParams {
  page?: number;
  pageSize?: number;
  ticker?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface RefreshResponse {
  triggered: boolean;
  schedule: string;
  jobId: number | null;
  message: string;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warning" | "error" | "step";
  message: string;
  step?: number;
  totalSteps?: number;
}

export interface SchedulerState {
  enabled: boolean;
  morningTime: string;
  eveningTime: string;
  nextRun: string | null;
  message?: string;
}
