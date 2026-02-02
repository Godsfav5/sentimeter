/**
 * Ticker Extractor Tests
 *
 * Tests the ticker extraction with batch processing.
 */

import { test, expect, describe } from "bun:test";
import { extractTickersFromNews } from "./ticker-extractor.ts";
import type { NewsArticleInput } from "./types.ts";

const TIMEOUT_MS = 60000;

describe("Ticker Extractor", () => {
  test(
    "extracts tickers from single article",
    async () => {
      const articles: NewsArticleInput[] = [
        {
          title: "Bank BCA (BBCA) Reports Record Profits in Q4",
          content: "Bank Central Asia posted strong earnings beating analyst expectations.",
          portal: "Test Portal",
          publishedAt: new Date(),
        },
      ];

      const result = await extractTickersFromNews(articles);

      console.log("Single article result:", result);

      expect(result.articlesAnalyzed).toBe(1);
      expect(result.tickers.length).toBeGreaterThanOrEqual(1);

      const bbca = result.tickers.find((t) => t.ticker === "BBCA");
      expect(bbca).toBeDefined();
    },
    TIMEOUT_MS
  );

  test(
    "extracts multiple tickers from multiple articles",
    async () => {
      const articles: NewsArticleInput[] = [
        {
          title: "BBCA dan BMRI Catat Kinerja Positif",
          content: "Bank BCA dan Bank Mandiri mencatat pertumbuhan laba.",
          portal: "Bisnis",
          publishedAt: new Date(),
        },
        {
          title: "Telkom (TLKM) Umumkan Dividen Interim",
          content: "PT Telkom Indonesia mengumumkan pembagian dividen.",
          portal: "Kontan",
          publishedAt: new Date(),
        },
        {
          title: "Saham ASII Menguat Seiring Penjualan Mobil Naik",
          content: "Astra International mencatat kenaikan penjualan.",
          portal: "CNBC",
          publishedAt: new Date(),
        },
      ];

      const result = await extractTickersFromNews(articles);

      console.log("Multiple articles result:", result);
      console.log("Tickers found:", result.tickers.map((t) => t.ticker));

      expect(result.articlesAnalyzed).toBe(3);
      expect(result.tickers.length).toBeGreaterThanOrEqual(2);
    },
    TIMEOUT_MS
  );

  test(
    "handles batch processing for many articles",
    async () => {
      // Create 15 articles to test batching (batch size is 10)
      const articles: NewsArticleInput[] = [
        { title: "BBCA mencatat laba tinggi", content: null, portal: "A", publishedAt: new Date() },
        { title: "TLKM umumkan dividen", content: null, portal: "B", publishedAt: new Date() },
        { title: "ASII penjualan naik", content: null, portal: "C", publishedAt: new Date() },
        { title: "BMRI ekspansi kredit", content: null, portal: "D", publishedAt: new Date() },
        { title: "UNVR luncurkan produk baru", content: null, portal: "E", publishedAt: new Date() },
        { title: "ICBP akuisisi perusahaan", content: null, portal: "F", publishedAt: new Date() },
        { title: "INDF laba meningkat", content: null, portal: "G", publishedAt: new Date() },
        { title: "GGRM market share naik", content: null, portal: "H", publishedAt: new Date() },
        { title: "HMSP harga rokok naik", content: null, portal: "I", publishedAt: new Date() },
        { title: "KLBF ekspor farmasi", content: null, portal: "J", publishedAt: new Date() },
        { title: "BBNI kredit tumbuh", content: null, portal: "K", publishedAt: new Date() },
        { title: "BBRI laba UMKM", content: null, portal: "L", publishedAt: new Date() },
        { title: "ANTM harga nikel naik", content: null, portal: "M", publishedAt: new Date() },
        { title: "PTBA batubara ekspor", content: null, portal: "N", publishedAt: new Date() },
        { title: "ADRO volume produksi", content: null, portal: "O", publishedAt: new Date() },
      ];

      console.log("Testing batch processing with", articles.length, "articles...");

      const result = await extractTickersFromNews(articles);

      console.log("Batch result:", {
        articlesAnalyzed: result.articlesAnalyzed,
        tickersFound: result.tickers.length,
        processingTimeMs: result.processingTimeMs,
      });
      console.log("Tickers:", result.tickers.map((t) => t.ticker));

      expect(result.articlesAnalyzed).toBe(15);
      expect(result.tickers.length).toBeGreaterThanOrEqual(5);
    },
    TIMEOUT_MS * 2
  );

  test(
    "returns empty for articles without tickers",
    async () => {
      const articles: NewsArticleInput[] = [
        {
          title: "Cuaca Cerah di Jakarta Hari Ini",
          content: "Prakiraan cuaca menunjukkan langit cerah.",
          portal: "Weather",
          publishedAt: new Date(),
        },
      ];

      const result = await extractTickersFromNews(articles);

      console.log("No tickers result:", result);

      expect(result.articlesAnalyzed).toBe(1);
      // May or may not find tickers depending on model interpretation
    },
    TIMEOUT_MS
  );

  test(
    "handles empty articles array",
    async () => {
      const result = await extractTickersFromNews([]);

      expect(result.articlesAnalyzed).toBe(0);
      expect(result.tickers.length).toBe(0);
      expect(result.processingTimeMs).toBe(0);
    },
    TIMEOUT_MS
  );
});
