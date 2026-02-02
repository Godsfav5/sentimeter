/**
 * Recommendations Route
 *
 * GET /api/recommendations - Get today's stock recommendations
 */

import type {
  RecommendationsResponse,
  RecommendationItem,
  ActivePositionItem,
} from "../types.ts";
import { successResponse, errorResponse } from "../types.ts";
import { jsonResponse } from "../middleware/cors.ts";
import {
  getTodayRecommendations,
  getStockFundamental,
} from "../../lib/database/queries.ts";
import {
  getTrackedPredictions,
  getPredictionSummary,
} from "../../lib/prediction-tracker/index.ts";
import type { Recommendation } from "../../lib/database/types.ts";

export async function handleRecommendations(request: Request): Promise<Response> {
  const origin = request.headers.get("Origin");
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");

  try {
    // Get today's date or specified date
    const targetDate = dateParam ?? new Date().toISOString().slice(0, 10);

    // Get recommendations from database
    const recommendations = getTodayRecommendations();

    // Transform to API response format
    const items: RecommendationItem[] = recommendations.map((rec) =>
      transformRecommendation(rec)
    );

    // Get active positions
    const trackedPredictions = await getTrackedPredictions();
    const activePositions: ActivePositionItem[] = trackedPredictions
      .filter((p) => p.status === "pending" || p.status === "entry_hit")
      .map((p) => ({
        ticker: p.ticker,
        companyName: getCompanyName(p.ticker),
        recommendationDate: p.recommendationDate,
        entryPrice: p.entryPrice,
        currentPrice: p.currentPrice,
        stopLoss: p.stopLoss,
        targetPrice: p.targetPrice,
        status: p.status,
        unrealizedPnlPct: p.unrealizedPnlPct,
        daysHeld: p.daysActive,
        suggestedAction: getSuggestedAction(p),
      }));

    // Get summary
    const summary = getPredictionSummary(targetDate);

    // Determine schedule based on current time
    const hour = new Date().getHours();
    const schedule = hour < 12 ? "morning" : "evening";

    const response: RecommendationsResponse = {
      date: targetDate,
      schedule,
      generatedAt: new Date().toISOString(),
      recommendations: items,
      activePositions,
      summary,
    };

    return jsonResponse(successResponse(response), 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Recommendations error:", message);
    return jsonResponse(errorResponse(message), 500, origin);
  }
}

function transformRecommendation(rec: Recommendation): RecommendationItem {
  const fundamental = getStockFundamental(rec.ticker);

  const entryPrice = rec.entryPrice ?? 0;
  const stopLoss = rec.stopLoss ?? 0;
  const targetPrice = rec.targetPrice ?? 0;

  const riskPercent = entryPrice > 0 ? ((entryPrice - stopLoss) / entryPrice) * 100 : 0;
  const rewardPercent = entryPrice > 0 ? ((targetPrice - entryPrice) / entryPrice) * 100 : 0;
  const riskRewardRatio = riskPercent > 0 ? rewardPercent / riskPercent : 0;

  return {
    ticker: rec.ticker,
    companyName: fundamental?.companyName ?? rec.ticker,
    sector: fundamental?.sector ?? null,
    action: rec.action,
    currentPrice: entryPrice, // Will be updated with live price
    priceChange: 0,
    priceChangePct: 0,
    entryPrice,
    stopLoss,
    targetPrice,
    maxHoldDays: rec.maxHoldDays ?? 14,
    riskPercent,
    rewardPercent,
    riskRewardRatio,
    sentimentScore: rec.sentimentScore ?? 0,
    fundamentalScore: rec.fundamentalScore ?? 0,
    technicalScore: rec.technicalScore ?? 0,
    overallScore: rec.overallScore ?? 0,
    newsSummary: rec.newsSummary ?? "",
    fundamentalSummary: rec.fundamentalSummary ?? "",
    technicalSummary: rec.technicalSummary ?? "",
    analysisSummary: rec.analysisSummary ?? "",
    status: rec.status,
    statusMessage: getStatusMessage(rec),
    recommendationDate: rec.recommendationDate,
  };
}

function getCompanyName(ticker: string): string {
  const fundamental = getStockFundamental(ticker);
  return fundamental?.companyName ?? ticker;
}

function getStatusMessage(rec: Recommendation): string {
  const entryPrice = rec.entryPrice ?? 0;
  const targetPrice = rec.targetPrice ?? 0;
  const maxHoldDays = rec.maxHoldDays ?? 14;

  switch (rec.status) {
    case "pending":
      return `Wait for entry at Rp ${entryPrice.toLocaleString()}`;
    case "entry_hit":
      return `In position - target Rp ${targetPrice.toLocaleString()}`;
    case "target_hit":
      return `Target reached - closed with profit`;
    case "sl_hit":
      return `Stop loss hit - closed with loss`;
    case "expired":
      return `Position expired after ${maxHoldDays} days`;
    default:
      return "";
  }
}

function getSuggestedAction(prediction: {
  status: string;
  unrealizedPnlPct: number | null;
  daysActive: number;
  maxHoldDays: number;
  distanceToTargetPct: number;
}): string {
  if (prediction.status === "pending") {
    return "Wait for entry price";
  }

  if (prediction.unrealizedPnlPct !== null) {
    if (prediction.unrealizedPnlPct > 5) {
      return "Consider taking partial profit";
    }
    if (prediction.unrealizedPnlPct < -3) {
      return "Monitor closely - approaching stop loss";
    }
  }

  if (prediction.daysActive >= prediction.maxHoldDays - 2) {
    return "Approaching max hold days - prepare to exit";
  }

  return "Hold position";
}
