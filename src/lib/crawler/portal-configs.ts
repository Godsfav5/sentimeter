/**
 * Portal Configurations
 *
 * CSS selectors and parsing rules for each Indonesian news portal.
 */

import type { NewsPortalConfig } from "./types.ts";

export const PORTAL_CONFIGS: NewsPortalConfig[] = [
  {
    name: "CNBC Indonesia",
    baseUrl: "https://www.cnbcindonesia.com/market/",
    articleLinkSelector: "article a[href*='/market/'], .list-content a[href*='/market/']",
    titleSelector: "h1.title, h1.detail-title, article h1",
    contentSelector: ".detail-text, .detail_text, article .content",
    dateSelector: ".date, .detail-date, time",
    removeSelectors: [".ads", ".banner", "script", "style", ".related"],
    delayMs: 1500,
  },
  {
    name: "Bisnis Market",
    baseUrl: "https://market.bisnis.com/",
    articleLinkSelector: "a[href*='market.bisnis.com/read/'], .list-news a[href*='/read/'], .col-sm-7 a[href*='/read/']",
    titleSelector: "h1.detail-title, h1.news-title, .detail-title h1, h1",
    contentSelector: ".detail-content, .content-detail, .detail-text, article",
    dateSelector: ".date, .detail-date, time, .time",
    removeSelectors: [".ads", ".banner", "script", "style", ".baca-juga", ".related"],
    delayMs: 2000,
  },
  {
    name: "Kabar Bursa",
    baseUrl: "https://www.kabarbursa.com/market-hari-ini",
    articleLinkSelector: "a[href*='/market-hari-ini/'], .post-title a",
    titleSelector: "h1.entry-title, h1.post-title, h1",
    contentSelector: ".entry-content, .post-content, article",
    dateSelector: ".post-date, .entry-date, time",
    removeSelectors: [".ads", "script", "style", ".sharedaddy"],
    delayMs: 2000,
  },
  {
    name: "Detik Finance",
    baseUrl: "https://finance.detik.com/",
    articleLinkSelector: ".list-content a[href*='finance.detik.com'], article a",
    titleSelector: "h1.detail__title, .detail__title, h1",
    contentSelector: ".detail__body-text, .detail__body, .itp_bodycontent",
    dateSelector: ".detail__date, .date",
    removeSelectors: [".para_ads", ".ads", "script", "style", ".detail__media"],
    delayMs: 1500,
  },
  {
    name: "Katadata Bursa",
    baseUrl: "https://katadata.co.id/finansial/bursa",
    articleLinkSelector: "a[href*='/finansial/'], .title a",
    titleSelector: "h1.title, h1.detail-title, h1",
    contentSelector: ".detail-content, .content, article",
    dateSelector: ".date, time",
    removeSelectors: [".ads", "script", "style", ".related"],
    delayMs: 2000,
  },
  {
    name: "Kontan Insight",
    baseUrl: "https://insight.kontan.co.id/",
    articleLinkSelector: "a[href*='insight.kontan.co.id/news/']",
    titleSelector: "h1.title-article, .title-detail h1, h1",
    contentSelector: ".content-article, .content-detail, article",
    dateSelector: ".date, .date-article, time",
    removeSelectors: [".ads", "script", "style", ".baca-juga"],
    delayMs: 1500,
  },
  {
    name: "Stockbit Snips",
    baseUrl: "https://snips.stockbit.com/snips-terbaru/",
    articleLinkSelector: "a[href*='/snips-terbaru/-'], a[href*='/investasi/'], a[href*='/market-news/']",
    titleSelector: "h1.entry-title, h1[data-content-field='title']",
    contentSelector: ".sqs-block-content, .entry-content, article",
    dateSelector: ".dt-published, time.blog-meta-item",
    removeSelectors: ["script", "style", ".share-buttons", ".tags-cats"],
    delayMs: 2000,
  },
  {
    name: "Kompas Cuan",
    baseUrl: "https://money.kompas.com/cuan",
    articleLinkSelector: "a[href*='money.kompas.com/read/'], .article__list a, .latest--news a[href*='/read/']",
    titleSelector: "h1.read__title, .read__title h1, h1",
    contentSelector: ".read__content, .content__body, .read__body, article",
    dateSelector: ".read__time, .read__date, time, .date",
    removeSelectors: [".ads", "script", "style", ".read__more", ".related"],
    delayMs: 2000,
  },
  {
    name: "Investor ID",
    baseUrl: "https://investor.id/market/",
    articleLinkSelector: "a[href*='/market/']",
    titleSelector: "h1.title, h1.detail-title, h1",
    contentSelector: ".detail-content, .content-article, article",
    dateSelector: ".date, time",
    removeSelectors: [".ads", "script", "style", ".related-post"],
    delayMs: 2000,
  },
  {
    name: "Bloomberg Technoz",
    baseUrl: "https://www.bloombergtechnoz.com/kanal/finansial",
    articleLinkSelector: "a[href*='/detail-news/'], a[href*='bloombergtechnoz.com/detail-news/']",
    titleSelector: "h1.title, h1.article-title, .title-detail h1, h1",
    contentSelector: ".article-content, .content-detail, .detail-content, article",
    dateSelector: ".date, .article-date, time, .time-detail",
    removeSelectors: [".ads", "script", "style", ".related", ".share"],
    delayMs: 2000,
  },
  {
    name: "Bisnis Ekonomi",
    baseUrl: "https://ekonomi.bisnis.com/",
    articleLinkSelector: "a[href*='ekonomi.bisnis.com/read/']",
    titleSelector: "h1.detail-title, h1.news-title, h1",
    contentSelector: ".detail-content, .content-detail, article",
    dateSelector: ".date, time",
    removeSelectors: [".ads", "script", "style", ".baca-juga"],
    delayMs: 1500,
  },
  {
    name: "Sindo News Bursa",
    baseUrl: "https://ekbis.sindonews.com/bursa-finansial",
    articleLinkSelector: "a[href*='ekbis.sindonews.com/read/']",
    titleSelector: "h1.title, h1.detail-title, h1",
    contentSelector: ".detail-content, .content, article",
    dateSelector: ".date, time",
    removeSelectors: [".ads", "script", "style", ".baca-juga"],
    delayMs: 2000,
  },
  // IDN Financials removed - returns 403 Forbidden
  // Site blocks crawlers, would need proxy or different approach
  {
    name: "IDX Channel",
    baseUrl: "https://www.idxchannel.com/market-news/",
    articleLinkSelector: "a[href*='/market-news/']",
    titleSelector: "h1.title, h1.detail-title, h1",
    contentSelector: ".detail-content, .content, article",
    dateSelector: ".date, time",
    removeSelectors: [".ads", "script", "style", ".related"],
    delayMs: 2000,
  },
];

/**
 * Get portal config by base URL
 */
export function getPortalConfig(baseUrl: string): NewsPortalConfig | undefined {
  return PORTAL_CONFIGS.find((config) => baseUrl.includes(new URL(config.baseUrl).hostname));
}

/**
 * Get portal name from URL
 */
export function getPortalName(url: string): string {
  const config = PORTAL_CONFIGS.find((c) => url.includes(new URL(c.baseUrl).hostname));
  return config?.name ?? new URL(url).hostname;
}
