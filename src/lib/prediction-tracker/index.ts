/**
 * Prediction Tracker Module
 *
 * ⚠️ AI AGENTS: This module is split into submodules:
 * - types.ts: Type definitions for prediction tracking
 * - status-checker.ts: Logic to check price levels and determine status
 * - updater.ts: Update predictions in database with current prices
 * Do NOT create monolithic files. Follow the pattern.
 */

export * from "./types.ts";
export {
  checkStatusChange,
  calculatePnlPct,
  calculateDistancePct,
  calculateRiskReward,
  calculateDaysActive,
} from "./status-checker.ts";
export {
  updateAllPredictions,
  getTrackedPredictions,
  getPredictionSummary,
} from "./updater.ts";
