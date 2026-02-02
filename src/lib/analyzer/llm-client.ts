/**
 * LLM Client
 *
 * Uses Google GenAI SDK with Antigravity Manager proxy.
 * Replaces direct Gemini API calls to avoid quota issues.
 */

import { GoogleGenAI } from "@google/genai";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

const ANTIGRAVITY_BASE_URL = process.env.ANTIGRAVITY_BASE_URL ?? "http://127.0.0.1:8045";
const ANTIGRAVITY_API_KEY = process.env.ANTIGRAVITY_API_KEY ?? "";
const ANTIGRAVITY_MODEL = process.env.ANTIGRAVITY_MODEL ?? "gemini-3-flash";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const OUTPUT_FILE = "llm-output.json";

let genai: GoogleGenAI | null = null;

/**
 * Get or create the GenAI client
 */
function getClient(): GoogleGenAI {
  if (!genai) {
    if (!ANTIGRAVITY_API_KEY) {
      console.warn("WARNING: ANTIGRAVITY_API_KEY not set in environment");
    }
    genai = new GoogleGenAI({
      apiKey: ANTIGRAVITY_API_KEY,
      httpOptions: {
        baseUrl: ANTIGRAVITY_BASE_URL,
      },
    });
  }
  return genai;
}

export interface LLMResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  tokensUsed: number;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate") ||
      message.includes("quota") ||
      message.includes("429") ||
      message.includes("resource_exhausted")
    );
  }
  return false;
}

/**
 * Generate content using Antigravity Manager (Gemini protocol)
 */
export async function generateContent<T>(
  prompt: string,
  systemInstruction?: string
): Promise<LLMResponse<T>> {
  let lastError: string = "";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await getClient().models.generateContent({
        model: ANTIGRAVITY_MODEL,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json", // Force JSON output
        },
      });

      const text = response.text ?? "";
      const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

      // Parse JSON from response (should be clean JSON now)
      try {
        const parsed = JSON.parse(text) as T;
        return {
          success: true,
          data: parsed,
          error: null,
          tokensUsed,
        };
      } catch {
        // Fallback to regex parsing
        const parsed = parseJsonResponse<T>(text);
        if (!parsed) {
          return {
            success: false,
            data: null,
            error: "Failed to parse JSON from response",
            tokensUsed,
          };
        }
        return {
          success: true,
          data: parsed,
          error: null,
          tokensUsed,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = message;

      // Check if it's a rate limit error
      if (isRateLimitError(error)) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
        console.log(
          `Rate limit hit (attempt ${attempt + 1}/${MAX_RETRIES}). Waiting ${Math.round(delayMs / 1000)}s before retry...`
        );
        await sleep(delayMs);
        continue;
      }

      // Non-rate-limit error, don't retry
      break;
    }
  }

  return {
    success: false,
    data: null,
    error: lastError,
    tokensUsed: 0,
  };
}

/**
 * Parse JSON from LLM response text
 * Handles markdown code blocks and raw JSON
 */
function parseJsonResponse<T>(text: string): T | null {
  // Try to extract JSON from markdown code block
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = jsonBlockMatch ? jsonBlockMatch[1]?.trim() : text.trim();

  if (!jsonText) {
    return null;
  }

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    // Try to find JSON object in text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Check if Antigravity API is configured
 */
export function isLLMConfigured(): boolean {
  return ANTIGRAVITY_API_KEY.length > 0;
}

/**
 * Get current LLM configuration for debugging
 */
export function getLLMConfig(): { baseUrl: string; model: string; configured: boolean } {
  return {
    baseUrl: ANTIGRAVITY_BASE_URL,
    model: ANTIGRAVITY_MODEL,
    configured: isLLMConfigured(),
  };
}
