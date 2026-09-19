import yahooFinance from "yahoo-finance2";
import type { RawNewsItem } from "../types";

const UA =
  "Mozilla/5.0 (compatible; StockNewsIntel/1.0; +https://stock-news-intel.vercel.app)";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tagFromRss(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? stripHtml(m[1]!) : "";
}

function toIso(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // Yahoo sometimes returns seconds
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

/** Yahoo Finance headline RSS — gratis, sin API key. Prefiere es.finance si hay ítems. */
async function fetchYahooRssFrom(
  host: string,
  symbol: string,
  languageHint: "es" | "en"
): Promise<RawNewsItem[]> {
  const url = `https://${host}/rss/headline?s=${encodeURIComponent(symbol)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "User-Agent": UA,
      "Accept-Language": languageHint === "es" ? "es-CO,es;q=0.9" : "en-US,en;q=0.8",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Yahoo RSS (${host}) HTTP ${res.status}`);
  }
  const xml = await res.text();
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(
    (m) => m[1]!
  );
  if (blocks.length === 0) {
    throw new Error(`Yahoo RSS (${host}): sin ítems`);
  }

  return blocks.slice(0, 20).map((block, idx) => {
    const title = tagFromRss(block, "title") || "(sin título)";
    const link =
      tagFromRss(block, "link") ||
      `https://${host}/quote/${symbol}`;
    const description = tagFromRss(block, "description") || title;
    const pubDate = tagFromRss(block, "pubDate");
    const guid = tagFromRss(block, "guid") || `yahoo-rss-${languageHint}-${symbol}-${idx}`;
    return {
      id: String(guid).slice(0, 120),
      title,
      summary: description.slice(0, 600),
      url: link,
      publishedAt: toIso(pubDate),
      source: languageHint === "es" ? "Yahoo Finance (ES)" : "Yahoo Finance",
      tickers: [symbol],
      languageHint,
    } satisfies RawNewsItem;
  });
}

async function fetchYahooRss(symbol: string): Promise<RawNewsItem[]> {
  try {
    const esItems = await fetchYahooRssFrom("es.finance.yahoo.com", symbol, "es");
    if (esItems.length > 0) return esItems;
  } catch (err) {
    console.warn("[news] Yahoo RSS ES falló, probando EN:", err);
  }
  return fetchYahooRssFrom("finance.yahoo.com", symbol, "en");
}

/** yahoo-finance2 search news — gratis, sin key. */
async function fetchYahooSearchNews(symbol: string): Promise<RawNewsItem[]> {
  try {
    yahooFinance.suppressNotices(["yahooSurvey"]);
  } catch {
    /* ignore */
  }

  let lastErr: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      const result = await yahooFinance.search(symbol, {
        newsCount: 15,
        quotesCount: 0,
      });
      const news = result?.news ?? [];
      if (news.length === 0) {
        throw new Error("Yahoo search: sin noticias");
      }
      return news.map((n, idx) => {
        const title = n.title || "(sin título)";
        const link =
          n.link || `https://finance.yahoo.com/quote/${symbol}/news`;
        const related = n.relatedTickers ?? [symbol];
        return {
          id: String(n.uuid || `yahoo-search-${symbol}-${idx}`),
          title,
          summary: title.slice(0, 600),
          url: link,
          publishedAt: toIso(n.providerPublishTime),
          source: n.publisher || "Yahoo Finance",
          tickers: related.map((t) => String(t).toUpperCase()),
        } satisfies RawNewsItem;
      });
    } catch (err) {
      lastErr = err;
      await sleep(600 * Math.pow(2, i));
    }
  }
  throw lastErr ?? new Error("Yahoo search falló");
}

/**
 * Noticias reales sin key: RSS de Yahoo Finance, luego search de yahoo-finance2.
 */
export async function fetchYahooNews(ticker: string): Promise<RawNewsItem[]> {
  const symbol = ticker.trim().toUpperCase();

  try {
    const items = await fetchYahooRss(symbol);
    if (items.length > 0) return items;
  } catch (err) {
    console.warn("[news] Yahoo RSS falló:", err);
  }

  return fetchYahooSearchNews(symbol);
}
