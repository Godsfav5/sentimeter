/**
 * Database Migration Runner
 *
 * Initializes the database schema.
 * Run with: bun run db:migrate
 */

import { initDatabase } from "./schema.ts";

console.log("🗃️  Initializing Sentimeter database...");

try {
  initDatabase();
  console.log("✅ Database initialized successfully");
  console.log("   Tables created:");
  console.log("   - news_articles");
  console.log("   - news_tickers");
  console.log("   - recommendations");
  console.log("   - stock_fundamentals");
  console.log("   - price_history");
  console.log("   - job_executions");
} catch (error) {
  console.error("❌ Database initialization failed:", error);
  process.exit(1);
}
