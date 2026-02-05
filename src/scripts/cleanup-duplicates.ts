/**
 * Cleanup Duplicate Positions
 *
 * Removes duplicate active positions for the same ticker.
 * Keeps the older position (lower id = older).
 */

import { deleteDuplicatePositions, getActiveRecommendations } from "../lib/database/queries.ts";

console.log("🧹 Cleaning up duplicate positions...\n");

// Show current state before cleanup
const before = getActiveRecommendations();
const tickerCounts = new Map<string, number>();
for (const rec of before) {
  tickerCounts.set(rec.ticker, (tickerCounts.get(rec.ticker) ?? 0) + 1);
}

const duplicates = [...tickerCounts.entries()].filter(([, count]) => count > 1);
if (duplicates.length === 0) {
  console.log("✅ No duplicates found. All clear!");
  process.exit(0);
}

console.log("Found duplicates:");
for (const [ticker, count] of duplicates) {
  console.log(`   ${ticker}: ${count} active positions`);
}

// Run cleanup
const deleted = deleteDuplicatePositions();
console.log(`\n🗑️  Deleted ${deleted} duplicate position(s)`);

// Show state after cleanup
const after = getActiveRecommendations();
console.log(`\n📊 Active positions after cleanup: ${after.length}`);
for (const rec of after) {
  console.log(`   ${rec.ticker}: ${rec.recommendationDate} (id: ${rec.id})`);
}

console.log("\n✅ Cleanup complete!");
