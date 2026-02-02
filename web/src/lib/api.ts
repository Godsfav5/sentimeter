/**
 * API Client for Sentimeter
 */

import type {
  ApiResponse,
  RecommendationsResponse,
  HistoryResponse,
  HistoryParams,
  RefreshResponse,
  SchedulerState,
} from "./types";

const API_BASE = "/api";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!json.success || !json.data) {
    throw new Error(json.error ?? "Unknown error");
  }

  return json.data;
}

export async function getRecommendations(
  date?: string
): Promise<RecommendationsResponse> {
  const params = date ? `?date=${date}` : "";
  return fetchApi<RecommendationsResponse>(`/recommendations${params}`);
}

export async function getHistory(
  params: HistoryParams = {}
): Promise<HistoryResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.ticker) searchParams.set("ticker", params.ticker);
  if (params.status) searchParams.set("status", params.status);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const query = searchParams.toString();
  return fetchApi<HistoryResponse>(`/history${query ? `?${query}` : ""}`);
}

export async function triggerRefresh(): Promise<RefreshResponse> {
  return fetchApi<RefreshResponse>("/refresh", { method: "POST" });
}

export async function getScheduler(): Promise<SchedulerState> {
  return fetchApi<SchedulerState>("/scheduler");
}

export async function startScheduler(): Promise<SchedulerState> {
  return fetchApi<SchedulerState>("/scheduler/start", { method: "POST" });
}

export async function stopScheduler(): Promise<SchedulerState> {
  return fetchApi<SchedulerState>("/scheduler/stop", { method: "POST" });
}
