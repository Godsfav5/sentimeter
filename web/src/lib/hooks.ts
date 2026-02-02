/**
 * Custom Hooks for API Data Fetching
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  RecommendationsResponse,
  HistoryResponse,
  HistoryParams,
  LogEntry,
  SchedulerState,
} from "./types";
import { getRecommendations, getHistory, triggerRefresh, getScheduler, startScheduler, stopScheduler } from "./api";

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecommendations(date?: string): UseQueryResult<RecommendationsResponse> {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRecommendations(date);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useHistory(params: HistoryParams): UseQueryResult<HistoryResponse> {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHistory(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [params.page, params.pageSize, params.ticker, params.status, params.startDate, params.endDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useRefresh(): {
  trigger: () => Promise<void>;
  loading: boolean;
  result: { triggered: boolean; message: string } | null;
} {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ triggered: boolean; message: string } | null>(null);

  const trigger = useCallback(async () => {
    setLoading(true);
    try {
      const response = await triggerRefresh();
      setResult({ triggered: response.triggered, message: response.message });
    } catch (err) {
      setResult({
        triggered: false,
        message: err instanceof Error ? err.message : "Failed to trigger refresh",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading, result };
}

export function useLogStream(): {
  logs: LogEntry[];
  connected: boolean;
  clear: () => void;
} {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/logs");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type: string } & Partial<LogEntry>;
        if (data.type === "log" && data.level && data.message) {
          const entry: LogEntry = {
            timestamp: data.timestamp ?? new Date().toISOString(),
            level: data.level,
            message: data.message,
            step: data.step,
            totalSteps: data.totalSteps,
          };
          setLogs((prev) => [...prev, entry]);
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, connected, clear };
}

export function useScheduler(): {
  state: SchedulerState | null;
  loading: boolean;
  toggle: () => Promise<void>;
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<SchedulerState | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const result = await getScheduler();
      setState(result);
    } catch {
      // Ignore fetch errors
    }
  }, []);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  const toggle = useCallback(async () => {
    setLoading(true);
    try {
      if (state?.enabled) {
        const result = await stopScheduler();
        setState(result);
      } else {
        const result = await startScheduler();
        setState(result);
      }
    } catch {
      // Ignore toggle errors
    } finally {
      setLoading(false);
    }
  }, [state?.enabled]);

  return { state, loading, toggle, refetch: fetchState };
}
