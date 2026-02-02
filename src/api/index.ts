/**
 * API Server Entry Point
 *
 * Bun HTTP server for Sentimeter API.
 */

import { handleCors, jsonResponse } from "./middleware/cors.ts";
import { errorResponse } from "./types.ts";
import { handleRecommendations } from "./routes/recommendations.ts";
import { handleHistory } from "./routes/history.ts";
import { handleRefresh } from "./routes/refresh.ts";
import { handleLogs } from "./routes/logs.ts";
import { handleGetScheduler, handleStartScheduler, handleStopScheduler } from "./routes/scheduler.ts";
import { initDatabase } from "../lib/database/schema.ts";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

// Initialize database on startup
console.log("🗃️  Initializing database...");
initDatabase();

console.log(`🚀 Starting Sentimeter API server on port ${PORT}...`);

const server = Bun.serve({
  port: PORT,
  idleTimeout: 120, // 2 minutes for SSE connections

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get("Origin");

    // Handle CORS preflight
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    // Log request
    console.log(`${method} ${path}`);

    try {
      // Health check
      if (path === "/health" || path === "/") {
        return jsonResponse(
          {
            status: "ok",
            service: "sentimeter",
            timestamp: new Date().toISOString(),
          },
          200,
          origin
        );
      }

      // API Routes
      if (path === "/api/recommendations" && method === "GET") {
        return await handleRecommendations(request);
      }

      if (path === "/api/history" && method === "GET") {
        return await handleHistory(request);
      }

      if (path === "/api/refresh" && method === "POST") {
        return await handleRefresh(request);
      }

      if (path === "/api/logs" && method === "GET") {
        return handleLogs(request);
      }

      if (path === "/api/scheduler" && method === "GET") {
        return handleGetScheduler(request);
      }

      if (path === "/api/scheduler/start" && method === "POST") {
        return handleStartScheduler(request);
      }

      if (path === "/api/scheduler/stop" && method === "POST") {
        return handleStopScheduler(request);
      }

      // 404 Not Found
      return jsonResponse(errorResponse(`Not found: ${path}`), 404, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Server error:", message);
      return jsonResponse(errorResponse("Internal server error"), 500, origin);
    }
  },

  error(error: Error): Response {
    console.error("Unhandled error:", error);
    return jsonResponse(errorResponse("Internal server error"), 500, null);
  },
});

console.log(`✅ Sentimeter API running at http://localhost:${server.port}`);
console.log(`
Available endpoints:
  GET  /health               - Health check
  GET  /api/recommendations  - Get today's stock recommendations
  GET  /api/history          - Get historical recommendations
  POST /api/refresh          - Trigger manual analysis refresh
  GET  /api/logs             - SSE stream for live analysis logs
  GET  /api/scheduler        - Get scheduler state
  POST /api/scheduler/start  - Start scheduler
  POST /api/scheduler/stop   - Stop scheduler
`);
