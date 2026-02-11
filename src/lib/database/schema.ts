/**
 * Database Schema
 *
 * SQLite database initialization and table creation.
 * Uses Bun's built-in SQLite support.
 */

import { Database } from "bun:sqlite";
import { join } from "path";

const DB_PATH = join(import.meta.dir, "../../../data/sentimeter.db");

export const db = new Database(DB_PATH, { create: true });

// Enable WAL mode for better concurrent access
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

/**
 * Initialize database with all required tables
 */
export function initDatabase(): void {
  // News articles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      portal TEXT NOT NULL,
      published_at DATETIME,
      crawled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      content_hash TEXT UNIQUE NOT NULL
    )
  `);

  // Index for deduplication lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_articles_content_hash
    ON news_articles(content_hash)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_articles_crawled_at
    ON news_articles(crawled_at)
  `);

  // News tickers (extracted from articles)
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_tickers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
      ticker TEXT NOT NULL,
      sentiment_score REAL NOT NULL,
      relevance_score REAL NOT NULL,
      extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_tickers_ticker
    ON news_tickers(ticker)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_news_tickers_extracted_at
    ON news_tickers(extracted_at)
  `);

  // Stock recommendations
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      recommendation_date DATE NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('BUY', 'HOLD', 'AVOID')),

      -- Price targets
      entry_price REAL NOT NULL,
      stop_loss REAL NOT NULL,
      target_price REAL NOT NULL,
      max_hold_days INTEGER NOT NULL,

      -- Order type: LIMIT (default, act after closing) or MARKET (direct entry)
      order_type TEXT DEFAULT 'LIMIT' CHECK(order_type IN ('LIMIT', 'MARKET')),

      -- Scores (0-100)
      sentiment_score REAL NOT NULL,
      fundamental_score REAL NOT NULL,
      technical_score REAL NOT NULL,
      overall_score REAL NOT NULL,

      -- Analysis text
      analysis_summary TEXT NOT NULL,
      news_summary TEXT NOT NULL,
      fundamental_summary TEXT NOT NULL,
      technical_summary TEXT NOT NULL,

      -- Status tracking
      status TEXT DEFAULT 'pending'
        CHECK(status IN ('pending', 'entry_hit', 'target_hit', 'sl_hit', 'expired')),
      entry_hit_date DATE,
      exit_date DATE,
      exit_price REAL,
      profit_loss_pct REAL,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(ticker, recommendation_date)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_recommendations_date
    ON recommendations(recommendation_date)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_recommendations_status
    ON recommendations(status)
  `);

  // Stock fundamentals cache
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_fundamentals (
      ticker TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      sector TEXT,
      market_cap REAL,
      pe_ratio REAL,
      pb_ratio REAL,
      roe REAL,
      debt_to_equity REAL,
      dividend_yield REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Price history (last 3 months)
  db.exec(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      date DATE NOT NULL,
      open REAL NOT NULL,
      high REAL NOT NULL,
      low REAL NOT NULL,
      close REAL NOT NULL,
      volume INTEGER NOT NULL,

      UNIQUE(ticker, date)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_price_history_ticker_date
    ON price_history(ticker, date)
  `);

  // Job execution log
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule TEXT NOT NULL CHECK(schedule IN ('morning', 'evening')),
      execution_date DATE NOT NULL,
      status TEXT DEFAULT 'running'
        CHECK(status IN ('running', 'completed', 'failed')),
      articles_processed INTEGER DEFAULT 0,
      tickers_extracted INTEGER DEFAULT 0,
      recommendations_generated INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,

      UNIQUE(schedule, execution_date)
    )
  `);

  // Migration: add order_type column if not exists
  // NOTE: SQLite ALTER TABLE ADD COLUMN does NOT support CHECK constraints
  try {
    db.exec(`ALTER TABLE recommendations ADD COLUMN order_type TEXT DEFAULT 'LIMIT'`);
  } catch {
    // Column already exists - ignore
  }
}
