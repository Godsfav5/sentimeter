/**
 * Scheduler Routes
 *
 * GET /api/scheduler - Get scheduler state
 * POST /api/scheduler/start - Start scheduler
 * POST /api/scheduler/stop - Stop scheduler
 */

import { jsonResponse } from "../middleware/cors.ts";
import { successResponse, errorResponse } from "../types.ts";
import {
  getSchedulerState,
  startScheduler,
  stopScheduler,
} from "../scheduler-manager.ts";

export function handleGetScheduler(request: Request): Response {
  const origin = request.headers.get("Origin");
  const state = getSchedulerState();
  return jsonResponse(successResponse(state), 200, origin);
}

export function handleStartScheduler(request: Request): Response {
  const origin = request.headers.get("Origin");
  startScheduler();
  const state = getSchedulerState();
  return jsonResponse(successResponse({ ...state, message: "Scheduler started" }), 200, origin);
}

export function handleStopScheduler(request: Request): Response {
  const origin = request.headers.get("Origin");
  stopScheduler();
  const state = getSchedulerState();
  return jsonResponse(successResponse({ ...state, message: "Scheduler stopped" }), 200, origin);
}
