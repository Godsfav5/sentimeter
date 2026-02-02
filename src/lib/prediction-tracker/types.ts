/**
 * Prediction Tracker Types
 *
 * Type definitions for tracking prediction status.
 */

export type PredictionStatus =
  | "pending" // Waiting for entry price to be hit
  | "entry_hit" // Entry price reached, position is active
  | "target_hit" // Target price reached, closed with profit
  | "sl_hit" // Stop loss hit, closed with loss
  | "expired"; // Max hold days exceeded without resolution

export interface TrackedPrediction {
  id: number;
  ticker: string;
  recommendationDate: string;

  // Price levels
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  maxHoldDays: number;

  // Current state
  status: PredictionStatus;
  currentPrice: number;
  daysActive: number;

  // Entry tracking
  entryHitDate: string | null;
  entryHitPrice: number | null;

  // Exit tracking
  exitDate: string | null;
  exitPrice: number | null;
  profitLossPct: number | null;

  // Computed fields
  unrealizedPnlPct: number | null;
  distanceToEntryPct: number;
  distanceToTargetPct: number;
  distanceToSlPct: number;
  riskRewardRatio: number;
}

export interface StatusUpdate {
  id: number;
  ticker: string;
  previousStatus: PredictionStatus;
  newStatus: PredictionStatus;
  price: number;
  reason: string;
  timestamp: Date;
}

export interface TrackingResult {
  checked: number;
  updated: number;
  statusUpdates: StatusUpdate[];
  errors: string[];
}

export interface PredictionSummary {
  totalActive: number;
  pending: number;
  entryHit: number;
  closedToday: number;
  winRate: number | null;
  avgReturn: number | null;
}
