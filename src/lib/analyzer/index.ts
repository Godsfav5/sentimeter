/**
 * Analyzer Module
 *
 * ⚠️ AI AGENTS: This module is split into submodules:
 * - types.ts: Type definitions for analysis inputs/outputs
 * - llm-client.ts: Antigravity Manager OpenAI-compatible client
 * - ticker-extractor.ts: Extract tickers from news articles
 * - stock-analyzer.ts: Analyze stocks and generate recommendations
 * Do NOT create monolithic files. Follow the pattern.
 */

export * from "./types.ts";
export { generateContent, isLLMConfigured, getLLMConfig } from "./llm-client.ts";
export { extractTickersFromNews } from "./ticker-extractor.ts";
export { analyzeStock } from "./stock-analyzer.ts";

import type { StockAnalysisInput, StockAnalysisResult } from "./types.ts";
import { analyzeStock } from "./stock-analyzer.ts";

/**
 * Analyze multiple stocks and return recommendations
 */
export async function analyzeMultipleStocks(
  inputs: StockAnalysisInput[]
): Promise<Map<string, StockAnalysisResult | null>> {
  const results = new Map<string, StockAnalysisResult | null>();

  // Process sequentially to avoid rate limiting
  for (const input of inputs) {
    console.log(`🔍 Analyzing ${input.ticker}...`);
    const result = await analyzeStock(input);
    results.set(input.ticker, result);

    // Delay between API calls
    await sleep(1000);
  }

  return results;
}

/**
 * Filter and rank analysis results
 */
export function rankRecommendations(
  results: Map<string, StockAnalysisResult | null>
): StockAnalysisResult[] {
  const validResults: StockAnalysisResult[] = [];

  for (const result of results.values()) {
    if (result && result.action === "BUY") {
      validResults.push(result);
    }
  }

  // Sort by overall score descending
  return validResults.sort((a, b) => b.overallScore - a.overallScore);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
