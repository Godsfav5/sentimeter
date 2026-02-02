/**
 * LLM Client Tests
 *
 * Tests the Antigravity Manager OpenAI-compatible client.
 */

import { test, expect, describe } from "bun:test";
import { generateContent, isLLMConfigured, getLLMConfig } from "./llm-client.ts";

const TIMEOUT_MS = 15000;

describe("LLM Client Configuration", () => {
  test("getLLMConfig returns configuration", () => {
    const config = getLLMConfig();

    expect(config).toHaveProperty("baseUrl");
    expect(config).toHaveProperty("model");
    expect(config).toHaveProperty("configured");
    expect(typeof config.baseUrl).toBe("string");
    expect(typeof config.model).toBe("string");
    expect(typeof config.configured).toBe("boolean");

    console.log("LLM Config:", config);
  });

  test("isLLMConfigured returns boolean", () => {
    const configured = isLLMConfigured();
    expect(typeof configured).toBe("boolean");
    console.log("LLM Configured:", configured);
  });
});

describe("LLM Client - Generate Content", () => {
  test(
    "generates simple JSON response",
    async () => {
      const systemInstruction = "You only respond with valid JSON, no other text.";
      const prompt = `Return exactly this JSON object: {"message": "hello", "number": 42}`;

      const response = await generateContent<{ message: string; number: number }>(prompt, systemInstruction);

      console.log("Response:", response);

      if (!response.success) {
        console.log("Error:", response.error);
        // Skip test if API is not available
        if (response.error?.includes("ECONNREFUSED") || response.error?.includes("fetch failed")) {
          console.log("Skipping: Antigravity Manager not running");
          return;
        }
      }

      expect(response.success).toBe(true);
      expect(response.data).not.toBeNull();
      expect(response.data).toHaveProperty("message");
      expect(response.data).toHaveProperty("number");
    },
    TIMEOUT_MS
  );

  test(
    "handles system instruction",
    async () => {
      const systemInstruction = "You are a helpful assistant that only responds in JSON format.";
      const prompt = `What is 2 + 2? Respond with: {"answer": <number>}`;

      const response = await generateContent<{ answer: number }>(prompt, systemInstruction);

      console.log("Response with system instruction:", response);

      if (!response.success) {
        if (response.error?.includes("ECONNREFUSED") || response.error?.includes("fetch failed")) {
          console.log("Skipping: Antigravity Manager not running");
          return;
        }
      }

      expect(response.success).toBe(true);
      expect(response.data?.answer).toBe(4);
    },
    TIMEOUT_MS
  );

  test(
    "extracts tickers from news text",
    async () => {
      const systemInstruction = `You are a financial analyst. Extract stock tickers mentioned.
Only extract valid Indonesian stock tickers (4-letter codes).
Respond with JSON: {"tickers": [{"code": "XXXX", "sentiment": 0.5}]}`;

      const prompt = `Analyze this news:
"Bank Central Asia (BBCA) reported strong Q4 earnings, beating analyst expectations.
Meanwhile, Telkom Indonesia (TLKM) announced a new dividend policy."

Extract tickers and sentiment.`;

      const response = await generateContent<{
        tickers: Array<{ code: string; sentiment: number }>;
      }>(prompt, systemInstruction);

      console.log("Ticker extraction response:", response);

      if (!response.success) {
        if (response.error?.includes("ECONNREFUSED") || response.error?.includes("fetch failed")) {
          console.log("Skipping: Antigravity Manager not running");
          return;
        }
      }

      expect(response.success).toBe(true);
      expect(response.data?.tickers).toBeInstanceOf(Array);
      expect(response.data?.tickers.length).toBeGreaterThan(0);

      const codes = response.data?.tickers.map((t) => t.code) ?? [];
      expect(codes).toContain("BBCA");
      expect(codes).toContain("TLKM");
    },
    TIMEOUT_MS
  );

  test(
    "returns error for connection failure gracefully",
    async () => {
      // This test verifies error handling works
      const response = await generateContent<{ test: string }>("test");

      // Either succeeds or fails gracefully
      expect(response).toHaveProperty("success");
      expect(response).toHaveProperty("data");
      expect(response).toHaveProperty("error");
      expect(response).toHaveProperty("tokensUsed");

      console.log("Graceful response:", {
        success: response.success,
        hasData: response.data !== null,
        error: response.error?.slice(0, 50),
      });
    },
    TIMEOUT_MS
  );
});

describe("LLM Client - Integration", () => {
  test(
    "full stock analysis prompt",
    async () => {
      const systemInstruction = `You are a stock analyst. Analyze and provide recommendation.
Respond with JSON: {"action": "BUY"|"HOLD"|"AVOID", "confidence": 1-10, "reason": "brief reason"}`;

      const prompt = `Analyze BBCA stock:
- Current Price: Rp 9,500
- P/E Ratio: 18.5
- ROE: 21%
- Trend: BULLISH
- Recent news: Strong earnings beat

Provide trading recommendation.`;

      const response = await generateContent<{
        action: string;
        confidence: number;
        reason: string;
      }>(prompt, systemInstruction);

      console.log("Stock analysis response:", response);

      if (!response.success) {
        if (response.error?.includes("ECONNREFUSED") || response.error?.includes("fetch failed")) {
          console.log("Skipping: Antigravity Manager not running");
          return;
        }
      }

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty("action");
      expect(response.data).toHaveProperty("confidence");
      expect(response.data).toHaveProperty("reason");
      expect(["BUY", "HOLD", "AVOID"]).toContain(response.data?.action ?? "");
      expect(response.data?.confidence ?? 0).toBeGreaterThanOrEqual(1);
      expect(response.data?.confidence ?? 0).toBeLessThanOrEqual(10);
    },
    TIMEOUT_MS
  );
});
