/**
 * Status Checker
 *
 * Checks current prices against prediction levels to determine status changes.
 */

import type { PredictionStatus, StatusUpdate, TrackedPrediction } from "./types.ts";

/**
 * Check if prediction status should change based on current price
 */
export function checkStatusChange(
  prediction: TrackedPrediction,
  currentPrice: number
): StatusUpdate | null {
  const { id, ticker, status, entryPrice, stopLoss, targetPrice, maxHoldDays, daysActive } =
    prediction;

  // Already closed - no changes possible
  if (status === "target_hit" || status === "sl_hit" || status === "expired") {
    return null;
  }

  // Pending - check if entry price is hit
  if (status === "pending") {
    if (isPriceHit(currentPrice, entryPrice)) {
      return {
        id,
        ticker,
        previousStatus: status,
        newStatus: "entry_hit",
        price: currentPrice,
        reason: `Entry price ${entryPrice} reached at ${currentPrice}`,
        timestamp: new Date(),
      };
    }

    // Check if expired while pending
    if (daysActive >= maxHoldDays) {
      return {
        id,
        ticker,
        previousStatus: status,
        newStatus: "expired",
        price: currentPrice,
        reason: `Max hold days (${maxHoldDays}) exceeded without entry`,
        timestamp: new Date(),
      };
    }

    return null;
  }

  // Entry hit - check for target, stop loss, or expiry
  if (status === "entry_hit") {
    // Check stop loss first (priority for risk management)
    if (currentPrice <= stopLoss) {
      return {
        id,
        ticker,
        previousStatus: status,
        newStatus: "sl_hit",
        price: currentPrice,
        reason: `Stop loss ${stopLoss} triggered at ${currentPrice}`,
        timestamp: new Date(),
      };
    }

    // Check target
    if (currentPrice >= targetPrice) {
      return {
        id,
        ticker,
        previousStatus: status,
        newStatus: "target_hit",
        price: currentPrice,
        reason: `Target price ${targetPrice} reached at ${currentPrice}`,
        timestamp: new Date(),
      };
    }

    // Check expiry
    if (daysActive >= maxHoldDays) {
      return {
        id,
        ticker,
        previousStatus: status,
        newStatus: "expired",
        price: currentPrice,
        reason: `Max hold days (${maxHoldDays}) exceeded, exiting at ${currentPrice}`,
        timestamp: new Date(),
      };
    }

    return null;
  }

  return null;
}

/**
 * Check if current price has hit the target price level
 * Uses a small tolerance to account for price fluctuations
 */
function isPriceHit(currentPrice: number, targetPrice: number): boolean {
  const tolerance = 0.005; // 0.5% tolerance
  const lowerBound = targetPrice * (1 - tolerance);
  const upperBound = targetPrice * (1 + tolerance);
  return currentPrice >= lowerBound && currentPrice <= upperBound;
}

/**
 * Calculate P&L percentage
 */
export function calculatePnlPct(entryPrice: number, exitPrice: number): number {
  return ((exitPrice - entryPrice) / entryPrice) * 100;
}

/**
 * Calculate distance to price level as percentage
 */
export function calculateDistancePct(currentPrice: number, targetPrice: number): number {
  return ((targetPrice - currentPrice) / currentPrice) * 100;
}

/**
 * Calculate risk/reward ratio
 */
export function calculateRiskReward(
  entryPrice: number,
  stopLoss: number,
  targetPrice: number
): number {
  const risk = entryPrice - stopLoss;
  const reward = targetPrice - entryPrice;

  if (risk <= 0) return 0;
  return reward / risk;
}

/**
 * Calculate days between two dates
 */
export function calculateDaysActive(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
