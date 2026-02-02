/**
 * Database Queries
 *
 * CRUD operations for all database entities.
 * Uses Bun's prepared statements for performance.
 */

import { db } from "./schema.ts";
import type {
  NewsArticle,
  NewsArticleInsert,
  NewsTicker,
  NewsTickerInsert,
  Recommendation,
  RecommendationInsert,
  RecommendationStatus,
  StockFundamental,
  StockFundamentalInsert,
  PriceHistory,
  PriceHistoryInsert,
  JobExecution,
  JobExecutionInsert,
  JobStatus,
} from "./types.ts";

// ============================================================================
// News Articles
// ============================================================================

export function insertNewsArticle(article: NewsArticleInsert): number {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO news_articles
      (url, title, content, portal, published_at, content_hash)
    VALUES ($url, $title, $content, $portal, $publishedAt, $contentHash)
  `);

  const result = stmt.run({
    $url: article.url,
    $title: article.title,
    $content: article.content ?? null,
    $portal: article.portal,
    $publishedAt: article.publishedAt?.toISOString() ?? null,
    $contentHash: article.contentHash,
  });

  return Number(result.lastInsertRowid);
}

export function getNewsArticleByHash(hash: string): NewsArticle | null {
  const stmt = db.prepare(`
    SELECT * FROM news_articles WHERE content_hash = $hash
  `);
  return stmt.get({ $hash: hash }) as NewsArticle | null;
}

export function getRecentNewsArticles(days: number = 7): NewsArticle[] {
  const stmt = db.prepare(`
    SELECT * FROM news_articles
    WHERE crawled_at >= datetime('now', $days)
    ORDER BY crawled_at DESC
  `);
  return stmt.all({ $days: `-${days} days` }) as NewsArticle[];
}

// ============================================================================
// News Tickers
// ============================================================================

export function insertNewsTicker(ticker: NewsTickerInsert): number {
  const stmt = db.prepare(`
    INSERT INTO news_tickers
      (article_id, ticker, sentiment_score, relevance_score)
    VALUES ($articleId, $ticker, $sentimentScore, $relevanceScore)
  `);

  const result = stmt.run({
    $articleId: ticker.articleId,
    $ticker: ticker.ticker.toUpperCase(),
    $sentimentScore: ticker.sentimentScore,
    $relevanceScore: ticker.relevanceScore,
  });

  return Number(result.lastInsertRowid);
}

export function insertNewsTickersBatch(tickers: NewsTickerInsert[]): void {
  const stmt = db.prepare(`
    INSERT INTO news_tickers
      (article_id, ticker, sentiment_score, relevance_score)
    VALUES ($articleId, $ticker, $sentimentScore, $relevanceScore)
  `);

  const insertMany = db.transaction((items: NewsTickerInsert[]) => {
    for (const ticker of items) {
      stmt.run({
        $articleId: ticker.articleId,
        $ticker: ticker.ticker.toUpperCase(),
        $sentimentScore: ticker.sentimentScore,
        $relevanceScore: ticker.relevanceScore,
      });
    }
  });

  insertMany(tickers);
}

export interface TickerMention {
  ticker: string;
  mentionCount: number;
  avgSentiment: number;
  avgRelevance: number;
}

export function getTopTickersByMentions(
  days: number = 1,
  limit: number = 10
): TickerMention[] {
  const stmt = db.prepare(`
    SELECT
      nt.ticker,
      COUNT(*) as mention_count,
      AVG(nt.sentiment_score) as avg_sentiment,
      AVG(nt.relevance_score) as avg_relevance
    FROM news_tickers nt
    JOIN news_articles na ON nt.article_id = na.id
    WHERE na.crawled_at >= datetime('now', $days)
    GROUP BY nt.ticker
    ORDER BY mention_count DESC, avg_relevance DESC
    LIMIT $limit
  `);

  const rows = stmt.all({ $days: `-${days} days`, $limit: limit }) as Array<{
    ticker: string;
    mention_count: number;
    avg_sentiment: number;
    avg_relevance: number;
  }>;

  return rows.map((row) => ({
    ticker: row.ticker,
    mentionCount: row.mention_count,
    avgSentiment: row.avg_sentiment,
    avgRelevance: row.avg_relevance,
  }));
}

// ============================================================================
// Recommendations
// ============================================================================

export function insertRecommendation(rec: RecommendationInsert): number {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO recommendations (
      ticker, recommendation_date, action,
      entry_price, stop_loss, target_price, max_hold_days,
      sentiment_score, fundamental_score, technical_score, overall_score,
      analysis_summary, news_summary, fundamental_summary, technical_summary
    ) VALUES (
      $ticker, $recommendationDate, $action,
      $entryPrice, $stopLoss, $targetPrice, $maxHoldDays,
      $sentimentScore, $fundamentalScore, $technicalScore, $overallScore,
      $analysisSummary, $newsSummary, $fundamentalSummary, $technicalSummary
    )
  `);

  const result = stmt.run({
    $ticker: rec.ticker.toUpperCase(),
    $recommendationDate: rec.recommendationDate,
    $action: rec.action,
    $entryPrice: rec.entryPrice,
    $stopLoss: rec.stopLoss,
    $targetPrice: rec.targetPrice,
    $maxHoldDays: rec.maxHoldDays,
    $sentimentScore: rec.sentimentScore,
    $fundamentalScore: rec.fundamentalScore,
    $technicalScore: rec.technicalScore,
    $overallScore: rec.overallScore,
    $analysisSummary: rec.analysisSummary,
    $newsSummary: rec.newsSummary,
    $fundamentalSummary: rec.fundamentalSummary,
    $technicalSummary: rec.technicalSummary,
  });

  return Number(result.lastInsertRowid);
}

export function getRecommendationsByDate(date: string): Recommendation[] {
  const stmt = db.prepare(`
    SELECT
      id, ticker, recommendation_date as recommendationDate, action,
      entry_price as entryPrice, stop_loss as stopLoss, target_price as targetPrice,
      max_hold_days as maxHoldDays, sentiment_score as sentimentScore,
      fundamental_score as fundamentalScore, technical_score as technicalScore,
      overall_score as overallScore, analysis_summary as analysisSummary,
      news_summary as newsSummary, fundamental_summary as fundamentalSummary,
      technical_summary as technicalSummary, status, entry_hit_date as entryHitDate,
      exit_date as exitDate, exit_price as exitPrice, profit_loss_pct as profitLossPct,
      created_at as createdAt
    FROM recommendations
    WHERE recommendation_date = $date
    ORDER BY overall_score DESC
  `);

  return stmt.all({ $date: date }) as Recommendation[];
}

export function getTodayRecommendations(): Recommendation[] {
  const stmt = db.prepare(`
    SELECT
      id,
      ticker,
      recommendation_date as recommendationDate,
      action,
      entry_price as entryPrice,
      stop_loss as stopLoss,
      target_price as targetPrice,
      max_hold_days as maxHoldDays,
      sentiment_score as sentimentScore,
      fundamental_score as fundamentalScore,
      technical_score as technicalScore,
      overall_score as overallScore,
      analysis_summary as analysisSummary,
      news_summary as newsSummary,
      fundamental_summary as fundamentalSummary,
      technical_summary as technicalSummary,
      status,
      entry_hit_date as entryHitDate,
      exit_date as exitDate,
      exit_price as exitPrice,
      profit_loss_pct as profitLossPct,
      created_at as createdAt
    FROM recommendations
    WHERE recommendation_date = date('now')
    ORDER BY overall_score DESC
  `);

  return stmt.all() as Recommendation[];
}

export function getActiveRecommendations(): Recommendation[] {
  const stmt = db.prepare(`
    SELECT
      id, ticker, recommendation_date as recommendationDate, action,
      entry_price as entryPrice, stop_loss as stopLoss, target_price as targetPrice,
      max_hold_days as maxHoldDays, sentiment_score as sentimentScore,
      fundamental_score as fundamentalScore, technical_score as technicalScore,
      overall_score as overallScore, analysis_summary as analysisSummary,
      news_summary as newsSummary, fundamental_summary as fundamentalSummary,
      technical_summary as technicalSummary, status, entry_hit_date as entryHitDate,
      exit_date as exitDate, exit_price as exitPrice, profit_loss_pct as profitLossPct,
      created_at as createdAt
    FROM recommendations
    WHERE status IN ('pending', 'entry_hit')
    ORDER BY recommendation_date DESC, overall_score DESC
  `);

  return stmt.all() as Recommendation[];
}

export function updateRecommendationStatus(
  id: number,
  status: RecommendationStatus,
  exitPrice?: number,
  profitLossPct?: number
): void {
  const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (status === "entry_hit") {
    const stmt = db.prepare(`
      UPDATE recommendations
      SET status = $status, entry_hit_date = $date
      WHERE id = $id
    `);
    stmt.run({
      $id: id,
      $status: status as string,
      $date: todayDate,
    });
  } else if (
    status === "target_hit" ||
    status === "sl_hit" ||
    status === "expired"
  ) {
    const stmt = db.prepare(`
      UPDATE recommendations
      SET status = $status, exit_date = $date,
          exit_price = $exitPrice, profit_loss_pct = $profitLossPct
      WHERE id = $id
    `);
    stmt.run({
      $id: id,
      $status: status as string,
      $date: todayDate,
      $exitPrice: exitPrice ?? null,
      $profitLossPct: profitLossPct ?? null,
    });
  }
}

// ============================================================================
// Stock Fundamentals
// ============================================================================

export function upsertStockFundamental(fund: StockFundamentalInsert): void {
  const stmt = db.prepare(`
    INSERT INTO stock_fundamentals (
      ticker, company_name, sector, market_cap,
      pe_ratio, pb_ratio, roe, debt_to_equity, dividend_yield
    ) VALUES (
      $ticker, $companyName, $sector, $marketCap,
      $peRatio, $pbRatio, $roe, $debtToEquity, $dividendYield
    )
    ON CONFLICT(ticker) DO UPDATE SET
      company_name = excluded.company_name,
      sector = excluded.sector,
      market_cap = excluded.market_cap,
      pe_ratio = excluded.pe_ratio,
      pb_ratio = excluded.pb_ratio,
      roe = excluded.roe,
      debt_to_equity = excluded.debt_to_equity,
      dividend_yield = excluded.dividend_yield,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run({
    $ticker: fund.ticker.toUpperCase(),
    $companyName: fund.companyName,
    $sector: fund.sector ?? null,
    $marketCap: fund.marketCap ?? null,
    $peRatio: fund.peRatio ?? null,
    $pbRatio: fund.pbRatio ?? null,
    $roe: fund.roe ?? null,
    $debtToEquity: fund.debtToEquity ?? null,
    $dividendYield: fund.dividendYield ?? null,
  });
}

export function getStockFundamental(ticker: string): StockFundamental | null {
  const stmt = db.prepare(`
    SELECT * FROM stock_fundamentals WHERE ticker = $ticker
  `);
  return stmt.get({ $ticker: ticker.toUpperCase() }) as StockFundamental | null;
}

// ============================================================================
// Price History
// ============================================================================

export function insertPriceHistoryBatch(prices: PriceHistoryInsert[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO price_history
      (ticker, date, open, high, low, close, volume)
    VALUES ($ticker, $date, $open, $high, $low, $close, $volume)
  `);

  const insertMany = db.transaction((items: PriceHistoryInsert[]) => {
    for (const price of items) {
      stmt.run({
        $ticker: price.ticker.toUpperCase(),
        $date: price.date,
        $open: price.open,
        $high: price.high,
        $low: price.low,
        $close: price.close,
        $volume: price.volume,
      });
    }
  });

  insertMany(prices);
}

export function getPriceHistory(
  ticker: string,
  days: number = 90
): PriceHistory[] {
  const stmt = db.prepare(`
    SELECT * FROM price_history
    WHERE ticker = $ticker AND date >= date('now', $days)
    ORDER BY date ASC
  `);

  return stmt.all({
    $ticker: ticker.toUpperCase(),
    $days: `-${days} days`,
  }) as PriceHistory[];
}

export function getLatestPrice(ticker: string): PriceHistory | null {
  const stmt = db.prepare(`
    SELECT * FROM price_history
    WHERE ticker = $ticker
    ORDER BY date DESC
    LIMIT 1
  `);

  return stmt.get({ $ticker: ticker.toUpperCase() }) as PriceHistory | null;
}

// ============================================================================
// Job Executions
// ============================================================================

export function startJobExecution(job: JobExecutionInsert): number {
  const stmt = db.prepare(`
    INSERT INTO job_executions (schedule, execution_date)
    VALUES ($schedule, $executionDate)
    ON CONFLICT(schedule, execution_date) DO UPDATE SET
      status = 'running',
      started_at = CURRENT_TIMESTAMP,
      completed_at = NULL,
      error_message = NULL
  `);

  const result = stmt.run({
    $schedule: job.schedule,
    $executionDate: job.executionDate,
  });

  return Number(result.lastInsertRowid);
}

export function completeJobExecution(
  id: number,
  stats: {
    articlesProcessed: number;
    tickersExtracted: number;
    recommendationsGenerated: number;
  }
): void {
  const stmt = db.prepare(`
    UPDATE job_executions
    SET status = 'completed',
        articles_processed = $articlesProcessed,
        tickers_extracted = $tickersExtracted,
        recommendations_generated = $recommendationsGenerated,
        completed_at = CURRENT_TIMESTAMP
    WHERE id = $id
  `);

  stmt.run({
    $id: id,
    $articlesProcessed: stats.articlesProcessed,
    $tickersExtracted: stats.tickersExtracted,
    $recommendationsGenerated: stats.recommendationsGenerated,
  });
}

export function failJobExecution(id: number, errorMessage: string): void {
  const stmt = db.prepare(`
    UPDATE job_executions
    SET status = 'failed',
        error_message = $errorMessage,
        completed_at = CURRENT_TIMESTAMP
    WHERE id = $id
  `);

  stmt.run({ $id: id, $errorMessage: errorMessage });
}

export function getJobExecution(
  schedule: string,
  date: string
): JobExecution | null {
  const stmt = db.prepare(`
    SELECT * FROM job_executions
    WHERE schedule = $schedule AND execution_date = $date
  `);

  return stmt.get({ $schedule: schedule, $date: date }) as JobExecution | null;
}

export function hasJobRunToday(schedule: string): boolean {
  const stmt = db.prepare(`
    SELECT 1 FROM job_executions
    WHERE schedule = $schedule
      AND execution_date = date('now')
      AND status = 'completed'
    LIMIT 1
  `);

  return stmt.get({ $schedule: schedule }) !== null;
}
