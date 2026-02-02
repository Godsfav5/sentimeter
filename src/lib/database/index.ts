/**
 * Database Module
 *
 * ⚠️ AI AGENTS: This module is split into submodules:
 * - types.ts: Type definitions for database entities
 * - schema.ts: Table creation and schema definitions
 * - queries.ts: CRUD operations
 * - migrate.ts: Database migration runner
 * Do NOT create monolithic files. Follow the pattern.
 */

export * from "./types.ts";
export { db, initDatabase } from "./schema.ts";
export * from "./queries.ts";
