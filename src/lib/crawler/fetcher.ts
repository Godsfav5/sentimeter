/**
 * HTTP Fetcher
 *
 * Handles HTTP requests with rate limiting, retries, and error handling.
 */

import type { FetchOptions } from "./types.ts";
import { DEFAULT_FETCH_OPTIONS } from "./types.ts";

export class FetchError extends Error {
  public code: string;

  constructor(code: string, message: string, cause?: Error) {
    super(`[${code}] ${message}`, { cause });
    this.name = "FetchError";
    this.code = code;
  }
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch URL with retries and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_FETCH_OPTIONS, ...options };
  const { timeout, retries, retryDelayMs, headers } = opts;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= (retries ?? 2); attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new FetchError(
          "HTTP_ERROR",
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const html = await response.text();
      return html;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof Error && error.name === "AbortError") {
        lastError = new FetchError("TIMEOUT", `Request timed out after ${timeout}ms`);
      }

      // Don't retry on certain errors
      if (lastError instanceof FetchError && lastError.code === "HTTP_ERROR") {
        const statusMatch = lastError.message.match(/HTTP (\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1] ?? "0", 10) : 0;
        // Don't retry 4xx errors (except 429)
        if (status >= 400 && status < 500 && status !== 429) {
          throw lastError;
        }
      }

      // Wait before retry
      if (attempt < (retries ?? 2)) {
        await sleep((retryDelayMs ?? 1000) * (attempt + 1));
      }
    }
  }

  throw lastError ?? new FetchError("UNKNOWN", "Unknown fetch error");
}

/**
 * Rate limiter for controlling request frequency per domain
 */
export class RateLimiter {
  private lastRequestTime: Map<string, number> = new Map();
  private defaultDelayMs: number;

  constructor(defaultDelayMs: number = 1000) {
    this.defaultDelayMs = defaultDelayMs;
  }

  /**
   * Wait if necessary to respect rate limit for domain
   */
  async waitForDomain(domain: string, delayMs?: number): Promise<void> {
    const delay = delayMs ?? this.defaultDelayMs;
    const lastTime = this.lastRequestTime.get(domain) ?? 0;
    const elapsed = Date.now() - lastTime;

    if (elapsed < delay) {
      await sleep(delay - elapsed);
    }

    this.lastRequestTime.set(domain, Date.now());
  }

  /**
   * Extract domain from URL
   */
  static getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
}

/**
 * Global rate limiter instance
 */
export const rateLimiter = new RateLimiter(1500);
