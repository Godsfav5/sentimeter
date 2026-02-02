/**
 * Daily Analysis Job
 *
 * Runs the complete analysis pipeline:
 * 1. Crawl news from all portals
 * 2. Extract tickers using Gemini
 * 3. Fetch market data from Yahoo Finance
 * 4. Generate recommendations
 * 5. Update prediction statuses
 */

import { crawlAllPortals } from "../lib/crawler/index.ts";
import type { CrawlSummary, RawArticle } from "../lib/crawler/types.ts";
import { extractTickersFromNews } from "../lib/analyzer/ticker-extractor.ts";
import { analyzeStock } from "../lib/analyzer/stock-analyzer.ts";
import type { NewsArticleInput, StockAnalysisInput } from "../lib/analyzer/types.ts";
import { fetchCurrentQuote, fetchPriceHistory, calculateTechnicalSummary } from "../lib/market-data/technical.ts";
import { fetchFundamentals } from "../lib/market-data/fundamental.ts";
import { updateAllPredictions, getTrackedPredictions } from "../lib/prediction-tracker/updater.ts";
import {
  insertNewsArticle,
  insertNewsTicker,
  insertRecommendation,
  upsertStockFundamental,
  startJobExecution,
  completeJobExecution,
  failJobExecution,
  hasJobRunToday,
  getRecentNewsArticles,
} from "../lib/database/queries.ts";
import type { JobSchedule, NewsArticleInsert, NewsTickerInsert } from "../lib/database/types.ts";
import { generateContentHash } from "../lib/crawler/deduplicator.ts";

const MIN_OVERALL_SCORE = 65;
const MAX_RECOMMENDATIONS_PER_RUN = 5;
const MAX_NEWS_AGE_DAYS = 1;
const MAX_CONTENT_LENGTH = 200; // Only use first 200 chars as description

interface JobResult {
  success: boolean;
  jobId: number;
  articlesProcessed: number;
  tickersFound: number;
  recommendationsGenerated: number;
  predictionsUpdated: number;
  errors: string[];
}

export async function runDailyAnalysis(schedule: JobSchedule, force: boolean = false): Promise<JobResult> {
  const today = new Date().toISOString().slice(0, 10);
  const errors: string[] = [];

  // Check if already run today (skip if force flag is set)
  if (!force && hasJobRunToday(schedule)) {
    console.log(`WARNING: ${schedule} analysis already completed for today`);
    console.log(`   Use --force to run anyway`);
    return {
      success: false,
      jobId: 0,
      articlesProcessed: 0,
      tickersFound: 0,
      recommendationsGenerated: 0,
      predictionsUpdated: 0,
      errors: [`${schedule} analysis already completed for today`],
    };
  }

  if (force) {
    console.log(`FORCE MODE: Running ${schedule} analysis despite previous run`);
  }

  // Start job
  const jobId = startJobExecution({ schedule, executionDate: today });
  console.log(`🚀 Starting ${schedule} analysis (Job ID: ${jobId})`);

  try {
    // Step 1: Crawl news
    console.log("\n📰 Step 1: Crawling news portals...");
    const crawlSummary: CrawlSummary = await crawlAllPortals();
    let articlesProcessed = crawlSummary.totalNewArticles;
    console.log(`   ✓ Processed ${articlesProcessed} new articles from ${crawlSummary.successfulPortals} portals`);

    // Collect articles for ticker extraction (only recent ones)
    const recentArticles = getRecentNewsArticles(MAX_NEWS_AGE_DAYS);
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - MAX_NEWS_AGE_DAYS * 24 * 60 * 60 * 1000);

    const articlesForExtraction: NewsArticleInput[] = recentArticles
      .filter((article) => {
        if (!article.publishedAt) return true; // Include if no date
        const pubDate = new Date(article.publishedAt);
        return pubDate >= cutoffDate;
      })
      .map((article) => ({
        title: article.title,
        content: article.content?.slice(0, MAX_CONTENT_LENGTH) ?? null, // Only first 200 chars
        portal: article.portal,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      }));

    console.log(`   ✓ Filtered to ${articlesForExtraction.length} articles from last ${MAX_NEWS_AGE_DAYS} days`);

    // Step 2: Extract tickers
    console.log("\n🔍 Step 2: Extracting tickers with AI...");
    const tickerResult = await extractTickersFromNews(articlesForExtraction);
    const tickersFound = tickerResult.tickers.length;
    console.log(`   ✓ Found ${tickersFound} unique ticker mentions`);

    // Save tickers to database (we don't have article IDs readily available, so skip for now)
    // In a real implementation, we'd track article IDs during crawling

    // Step 3: Aggregate tickers by relevance and sentiment
    console.log("\n📊 Step 3: Analyzing top tickers...");
    const topTickers = tickerResult.tickers
      .filter((t) => t.sentiment > 0.2) // Only positive sentiment
      .sort((a, b) => b.relevance - a.relevance || b.sentiment - a.sentiment)
      .slice(0, 10);

    console.log(`   ✓ Top tickers: ${topTickers.map((t) => t.ticker).join(", ")}`);

    // Step 4: Fetch market data and generate recommendations
    console.log("\n💹 Step 4: Fetching market data and generating recommendations...");
    const recommendations: Array<{ ticker: string; score: number }> = [];

    // Get active predictions for context
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
        console.log(`   Processing ${ticker}...`);

        // Fetch quote
        const quoteResult = await fetchCurrentQuote(ticker);
        if (!quoteResult.success || !quoteResult.data) {
          console.log(`   ⚠️  No quote for ${ticker}: ${quoteResult.error}`);
          continue;
        }
        const quote = quoteResult.data;

        // Fetch fundamentals
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

        // Fetch technicals
        const historyResult = await fetchPriceHistory(ticker, "3mo");
        if (!historyResult.success || !historyResult.data) {
          console.log(`   ⚠️  No price history for ${ticker}`);
          continue;
        }

        const technical = calculateTechnicalSummary(ticker, historyResult.data, quote.price);

        // Build analysis input
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

        // Generate recommendation
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
          console.log(`   ✓ ${ticker}: Score ${analysis.overallScore.toFixed(1)} - RECOMMENDED`);
        } else if (analysis) {
          console.log(`   ○ ${ticker}: Score ${analysis.overallScore.toFixed(1)} - ${analysis.action}`);
        } else {
          console.log(`   ○ ${ticker}: Analysis failed`);
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${ticker}: ${msg}`);
        console.log(`   ✗ ${ticker}: ${msg}`);
      }

      if (recommendations.length >= MAX_RECOMMENDATIONS_PER_RUN) break;
    }

    console.log(`   ✓ Generated ${recommendations.length} recommendations`);

    // Step 5: Update prediction statuses
    console.log("\n🔄 Step 5: Updating prediction statuses...");
    const updateResult = await updateAllPredictions();
    const predictionsUpdated = updateResult.updated;
    console.log(`   ✓ Updated ${predictionsUpdated} predictions`);

    // Complete job
    completeJobExecution(jobId, {
      articlesProcessed,
      tickersExtracted: tickersFound,
      recommendationsGenerated: recommendations.length,
    });

    console.log(`\n✅ ${schedule} analysis completed successfully!`);
    console.log(`   Articles: ${articlesProcessed}`);
    console.log(`   Tickers: ${tickersFound}`);
    console.log(`   Recommendations: ${recommendations.length}`);
    console.log(`   Predictions updated: ${predictionsUpdated}`);

    return {
      success: true,
      jobId,
      articlesProcessed,
      tickersFound,
      recommendationsGenerated: recommendations.length,
      predictionsUpdated,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failJobExecution(jobId, msg);
    console.error(`\n❌ ${schedule} analysis failed: ${msg}`);

    return {
      success: false,
      jobId,
      articlesProcessed: 0,
      tickersFound: 0,
      recommendationsGenerated: 0,
      predictionsUpdated: 0,
      errors: [msg, ...errors],
    };
  }
}

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2);
  const force = args.includes("--force") || args.includes("-f");
  const hour = new Date().getHours();
  const schedule: JobSchedule = hour < 12 ? "morning" : "evening";

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  SENTIMETER DAILY ANALYSIS - ${schedule.toUpperCase()}`);
  console.log(`  ${new Date().toISOString()}`);
  if (force) console.log(`  MODE: FORCE`);
  console.log(`${"=".repeat(60)}\n`);

  runDailyAnalysis(schedule, force)
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
