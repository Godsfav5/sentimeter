/**
 * Deduplicator
 *
 * Hash-based deduplication to avoid crawling the same content twice.
 */

import { getNewsArticleByHash } from "../database/queries.ts";

/**
 * Generate a hash for article content using Bun's built-in hasher
 */
export function generateContentHash(title: string, content: string | null): string {
  const normalizedTitle = normalizeText(title);
  const normalizedContent = content ? normalizeText(content) : "";

  // Use first 500 chars of content to avoid hashing huge texts
  const contentSample = normalizedContent.slice(0, 500);
  const combined = `${normalizedTitle}|${contentSample}`;

  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(combined);
  return hasher.digest("hex");
}

/**
 * Generate a URL-based hash for quick deduplication
 */
export function generateUrlHash(url: string): string {
  const normalizedUrl = normalizeUrl(url);
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(normalizedUrl);
  return hasher.digest("hex");
}

/**
 * Check if article already exists in database
 */
export function isArticleDuplicate(hash: string): boolean {
  const existing = getNewsArticleByHash(hash);
  return existing !== null;
}

/**
 * Normalize text for consistent hashing
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common punctuation variations
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""'']/g, '"')
    .replace(/[–—]/g, "-")
    .trim();
}

/**
 * Normalize URL for consistent comparison
 * - Remove trailing slashes
 * - Remove common tracking parameters
 * - Lowercase
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove common tracking params
    const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "ref", "source"];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Normalize
    let normalized = parsed.toString().toLowerCase();
    normalized = normalized.replace(/\/+$/, ""); // Remove trailing slashes

    return normalized;
  } catch {
    return url.toLowerCase().replace(/\/+$/, "");
  }
}

/**
 * Extract similar article signatures for fuzzy matching
 * Returns array of "signature" strings that can be compared
 */
export function extractSignatures(title: string): string[] {
  const normalized = normalizeText(title);
  const words = normalized.split(" ").filter((w) => w.length > 3);

  // Get first 5 significant words as a signature
  const signature = words.slice(0, 5).join(" ");

  return [signature];
}
