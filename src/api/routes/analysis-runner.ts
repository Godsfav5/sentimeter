/**
 * Analysis Runner
 *
 * Runs the daily analysis with live logging to SSE clients.
 */

import { logEmitter } from "../log-emitter.ts";
import { crawlAllPortals } from "../../lib/crawler/index.ts";
import { extractTickersFromNews } from "../../lib/analyzer/ticker-extractor.ts";
import { analyzeStock } from "../../lib/analyzer/stock-analyzer.ts";
import type { NewsArticleInput, StockAnalysisInput } from "../../lib/analyzer/types.ts";
import { fetchCurrentQuote, fetchPriceHistory, calculateTechnicalSummary } from "../../lib/market-data/technical.ts";
import { fetchFundamentals } from "../../lib/market-data/fundamental.ts";
import { updateAllPredictions, getTrackedPredictions } from "../../lib/prediction-tracker/updater.ts";
import {
  insertRecommendation,
  upsertStockFundamental,
  completeJobExecution,
  failJobExecution,
  getRecentNewsArticles,
  getActiveTickers,
} from "../../lib/database/queries.ts";
import type { JobSchedule } from "../../lib/database/types.ts";

const MIN_OVERALL_SCORE = 65;
const MAX_RECOMMENDATIONS_PER_RUN = 5;
const MAX_NEWS_AGE_DAYS = 1;
const MAX_CONTENT_LENGTH = 200;

export async function runAnalysisWithLogging(jobId: number, schedule: JobSchedule): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  logEmitter.startJob(jobId);

  try {
    // Step 1: Crawl news
    logEmitter.step(1, 5, "Crawling news portals...");
    const crawlSummary = await crawlAllPortals();
    logEmitter.success(`Processed ${crawlSummary.totalNewArticles} new articles from ${crawlSummary.successfulPortals} portals`);

    // Collect articles for ticker extraction
    const recentArticles = getRecentNewsArticles(MAX_NEWS_AGE_DAYS);
    const cutoffDate = new Date(Date.now() - MAX_NEWS_AGE_DAYS * 24 * 60 * 60 * 1000);

    const articlesForExtraction: NewsArticleInput[] = recentArticles
      .filter((article) => {
        if (!article.publishedAt) return true;
        return new Date(article.publishedAt) >= cutoffDate;
      })
      .map((article) => ({
        title: article.title,
        content: article.content?.slice(0, MAX_CONTENT_LENGTH) ?? null,
        portal: article.portal,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      }));

    logEmitter.info(`Filtered to ${articlesForExtraction.length} articles from last ${MAX_NEWS_AGE_DAYS} day(s)`);

    // Step 2: Extract tickers
    logEmitter.step(2, 5, "Extracting tickers with AI...");
    const tickerResult = await extractTickersFromNews(articlesForExtraction);
    logEmitter.success(`Found ${tickerResult.tickers.length} unique ticker mentions`);

    // Step 3: Aggregate tickers
    logEmitter.step(3, 5, "Analyzing top tickers...");

    // Get tickers with active positions to exclude them
    const activeTickers = new Set(getActiveTickers());
    if (activeTickers.size > 0) {
      logEmitter.info(`Excluding ${activeTickers.size} tickers with active positions: ${[...activeTickers].join(", ")}`);
    }

    const topTickers = tickerResult.tickers
      .filter((t) => t.sentiment > 0.2)
      .filter((t) => !activeTickers.has(t.ticker.toUpperCase())) // Exclude active positions
      .sort((a, b) => b.relevance - a.relevance || b.sentiment - a.sentiment)
      .slice(0, 10);

    logEmitter.info(`Top tickers: ${topTickers.map((t) => t.ticker).join(", ") || "none"}`);

    // Step 4: Fetch market data and generate recommendations
    logEmitter.step(4, 5, "Fetching market data and generating recommendations...");
    const recommendations: Array<{ ticker: string; score: number }> = [];

    const activePredictions = await getTrackedPredictions();
    const activePredictionInputs = activePredictions
      .filter((p) => p.status === "pending" || p.status === "entry_hit")
      .map((p) => ({
        ticker: p.ticker,
        recommendationDate: p.recommendationDate,
        entryPrice: p.entryPrice,
        stopLoss: p.stopLoss,
        targetPrice: p.targetPrice,
        currentPrice: p.currentPrice ?? p.entryPrice,
        status: p.status as "pending" | "entry_hit",
        daysActive: p.daysActive,
      }));

    for (const tickerInfo of topTickers) {
      const ticker = tickerInfo.ticker;

      try {
        logEmitter.info(`Processing ${ticker}...`);

        const quoteResult = await fetchCurrentQuote(ticker);
        if (!quoteResult.success || !quoteResult.data) {
          logEmitter.warn(`No quote for ${ticker}: ${quoteResult.error}`);
          continue;
        }
        const quote = quoteResult.data;

        const fundamentalsResult = await fetchFundamentals(ticker);
        const fundamentals = fundamentalsResult.success ? fundamentalsResult.data : null;

        if (fundamentals) {
          upsertStockFundamental({
            ticker: fundamentals.ticker,
            companyName: fundamentals.companyName,
            sector: fundamentals.sector,
            marketCap: fundamentals.marketCap,
            peRatio: fundamentals.peRatio,
            pbRatio: fundamentals.pbRatio,
            roe: fundamentals.roe,
            debtToEquity: fundamentals.debtToEquity,
            dividendYield: fundamentals.dividendYield,
          });
        }

        const historyResult = await fetchPriceHistory(ticker, "3mo");
        if (!historyResult.success || !historyResult.data) {
          logEmitter.warn(`No price history for ${ticker}`);
          continue;
        }

        const technical = calculateTechnicalSummary(ticker, historyResult.data, quote.price);

        const analysisInput: StockAnalysisInput = {
          ticker,
          companyName: fundamentals?.companyName ?? ticker,
          sector: fundamentals?.sector ?? null,
          currentPrice: quote.price,
          priceChange: quote.change,
          priceChangePct: quote.changePercent,
          peRatio: fundamentals?.peRatio ?? null,
          pbRatio: fundamentals?.pbRatio ?? null,
          roe: fundamentals?.roe ?? null,
          debtToEquity: fundamentals?.debtToEquity ?? null,
          dividendYield: fundamentals?.dividendYield ?? null,
          marketCap: fundamentals?.marketCap ?? null,
          trend: technical.trend,
          sma20: technical.sma20,
          sma50: technical.sma50,
          high3Month: technical.high3Month,
          low3Month: technical.low3Month,
          supports: technical.supports,
          resistances: technical.resistances,
          volatilityPercent: technical.volatilityPercent,
          newsMentions: [{
            title: tickerInfo.reason,
            sentiment: tickerInfo.sentiment,
            relevance: tickerInfo.relevance,
          }],
          activePredictions: activePredictionInputs.filter((p) => p.ticker === ticker),
        };

        const analysis = await analyzeStock(analysisInput);

        if (analysis && analysis.overallScore >= MIN_OVERALL_SCORE && analysis.action === "BUY") {
          insertRecommendation({
            ticker,
            recommendationDate: today,
            action: "BUY",
            entryPrice: analysis.entryPrice,
            stopLoss: analysis.stopLoss,
            targetPrice: analysis.targetPrice,
            maxHoldDays: analysis.maxHoldDays,
            sentimentScore: analysis.sentimentScore,
            fundamentalScore: analysis.fundamentalScore,
            technicalScore: analysis.technicalScore,
            overallScore: analysis.overallScore,
            newsSummary: analysis.newsSummary,
            fundamentalSummary: analysis.fundamentalSummary,
            technicalSummary: analysis.technicalSummary,
            analysisSummary: analysis.analysisSummary,
          });
          recommendations.push({ ticker, score: analysis.overallScore });
          logEmitter.success(`${ticker}: Score ${analysis.overallScore.toFixed(1)} - RECOMMENDED`);
        } else if (analysis) {
          logEmitter.info(`${ticker}: Score ${analysis.overallScore.toFixed(1)} - ${analysis.action}`);
        } else {
          logEmitter.warn(`${ticker}: Analysis failed`);
        }

        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logEmitter.error(`${ticker}: ${msg}`);
      }

      if (recommendations.length >= MAX_RECOMMENDATIONS_PER_RUN) break;
    }

    logEmitter.success(`Generated ${recommendations.length} recommendations`);

    // Step 5: Update prediction statuses
    logEmitter.step(5, 5, "Updating prediction statuses...");
    const updateResult = await updateAllPredictions();
    logEmitter.success(`Updated ${updateResult.updated} predictions`);

    // Complete job
    completeJobExecution(jobId, {
      articlesProcessed: crawlSummary.totalNewArticles,
      tickersExtracted: tickerResult.tickers.length,
      recommendationsGenerated: recommendations.length,
    });

    logEmitter.endJob(true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failJobExecution(jobId, msg);
    logEmitter.error(msg);
    logEmitter.endJob(false);
  }
}
