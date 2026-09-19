import yahooFinance from "yahoo-finance2";
import type {
  DailyBar,
  PriceAnalysis,
  PriceDirection,
  StreakResult,
} from "../types";

try {
  yahooFinance.suppressNotices(["yahooSurvey", "ripHistorical"]);
} catch {
  /* ignore en versiones sin suppressNotices */
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err);
  return /429|Too Many Requests|rate.?limit/i.test(msg);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 4,
  baseMs = 700
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i === attempts - 1) break;
      const backoff =
        baseMs * Math.pow(2, i) + Math.floor(Math.random() * 300);
      // Rate limits: wait longer; other errors: still retry briefly
      const wait = isRateLimitError(err) ? backoff : Math.min(backoff, 1200);
      await sleep(wait);
    }
  }
  throw last;
}

/** Calcula la racha alcista/bajista al final de la serie de cierres. */
export function computeStreak(closes: number[], windowDays: number): StreakResult {
  const slice = closes.slice(-windowDays);
  if (slice.length < 2) {
    return { days: windowDays, direction: "neutral", length: 0, closes: slice };
  }

  let direction: PriceDirection = "neutral";
  let length = 0;

  for (let i = slice.length - 1; i > 0; i--) {
    const diff = slice[i]! - slice[i - 1]!;
    const step: PriceDirection =
      diff > 0 ? "up" : diff < 0 ? "down" : "neutral";

    if (step === "neutral") {
      if (length === 0) continue;
      break;
    }

    if (direction === "neutral") {
      direction = step;
      length = 1;
      continue;
    }

    if (step === direction) {
      length += 1;
    } else {
      break;
    }
  }

  return { days: windowDays, direction, length, closes: slice };
}

/** Demo prices when Yahoo fails (offline / rate-limit). */
function demoPriceAnalysis(ticker: string): PriceAnalysis {
  const base =
    ticker === "AAPL"
      ? 227.5
      : ticker === "NVDA"
        ? 118.2
        : ticker === "TSLA"
          ? 248.4
          : ticker === "MSFT"
            ? 428.1
            : 100;

  const history: DailyBar[] = [];
  let price = base * 0.94;
  const today = new Date();
  for (let i = 40; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const drift = (Math.sin(i / 3) + 0.35) * 0.004;
    price = price * (1 + drift);
    history.push({
      date: d.toISOString().slice(0, 10),
      close: Number(price.toFixed(2)),
    });
  }

  const closes = history.map((h) => h.close);
  const last = closes[closes.length - 1]!;
  const prev = closes[closes.length - 2] ?? last;
  const changePct = ((last - prev) / prev) * 100;

  return {
    snapshot: {
      ticker,
      currency: "USD",
      price: last,
      previousClose: prev,
      changePct: Number(changePct.toFixed(2)),
      asOf: new Date().toISOString(),
      source: "demo",
    },
    streak7: computeStreak(closes, 7),
    streak30: computeStreak(closes, 30),
    history,
  };
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
    error?: { description?: string } | null;
  };
}

const YAHOO_UA =
  "Mozilla/5.0 (compatible; StockNewsIntel/1.0; +https://stock-news-intel.vercel.app)";

/** Direct Yahoo chart REST — often more reliable than the SDK under 429. */
async function fetchBarsViaChartApi(symbol: string): Promise<{
  history: DailyBar[];
  currency: string;
  livePrice: number | null;
}> {
  const hosts = [
    "https://query1.finance.yahoo.com",
    "https://query2.finance.yahoo.com",
  ];
  let lastErr: unknown;

  for (const host of hosts) {
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": YAHOO_UA,
        },
        cache: "no-store",
      });
      if (res.status === 429) {
        throw new Error("Too Many Requests");
      }
      if (!res.ok) {
        throw new Error(`Yahoo chart HTTP ${res.status}`);
      }
      const data = (await res.json()) as YahooChartResponse;
      const result = data.chart?.result?.[0];
      if (!result?.timestamp?.length) {
        throw new Error("Yahoo chart: sin datos");
      }
      const closes = result.indicators?.quote?.[0]?.close ?? [];
      const history: DailyBar[] = [];
      for (let i = 0; i < result.timestamp.length; i++) {
        const c = closes[i];
        if (c == null || !Number.isFinite(c)) continue;
        const date = new Date(result.timestamp[i]! * 1000)
          .toISOString()
          .slice(0, 10);
        history.push({ date, close: Number(c) });
      }
      if (history.length < 5) {
        throw new Error("Yahoo chart: serie corta");
      }
      const live =
        typeof result.meta?.regularMarketPrice === "number"
          ? result.meta.regularMarketPrice
          : null;
      return {
        history,
        currency: result.meta?.currency || "USD",
        livePrice: live,
      };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("Yahoo chart falló");
}

async function fetchBarsViaSdk(symbol: string): Promise<DailyBar[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 60);

  try {
    const chart = await yahooFinance.chart(symbol, {
      period1: start,
      period2: end,
      interval: "1d",
    });
    const quotes = chart?.quotes ?? [];
    return quotes
      .filter((q) => q.close != null && Number.isFinite(q.close))
      .map((q) => ({
        date: new Date(q.date).toISOString().slice(0, 10),
        close: Number(q.close),
      }));
  } catch {
    const result = await yahooFinance.historical(symbol, {
      period1: start,
      period2: end,
      interval: "1d",
    });
    return result
      .filter((q) => q.close != null && Number.isFinite(q.close))
      .map((q) => ({
        date: q.date.toISOString().slice(0, 10),
        close: Number(q.close),
      }));
  }
}

export async function fetchPriceAnalysis(ticker: string): Promise<PriceAnalysis> {
  const symbol = ticker.trim().toUpperCase();

  try {
    // 1) Direct chart API with retry/backoff (harden 429)
    const viaApi = await withRetry(() => fetchBarsViaChartApi(symbol), 4, 800);
    const history = viaApi.history;
    const closes = history.map((h) => h.close);
    const last = closes[closes.length - 1]!;
    const prev = closes[closes.length - 2] ?? null;
    const livePrice = viaApi.livePrice ?? last;

    return {
      snapshot: {
        ticker: symbol,
        currency: viaApi.currency,
        price: livePrice,
        previousClose: prev,
        changePct:
          prev != null
            ? Number((((livePrice - prev) / prev) * 100).toFixed(2))
            : null,
        asOf: new Date().toISOString(),
        source: "yahoo",
      },
      streak7: computeStreak(closes, 7),
      streak30: computeStreak(closes, 30),
      history,
    };
  } catch (apiErr) {
    console.warn("[price] Yahoo chart API falló, intentando SDK:", apiErr);
  }

  try {
    const history = await withRetry(() => fetchBarsViaSdk(symbol), 3, 900);
    if (history.length < 5) {
      return demoPriceAnalysis(symbol);
    }
    const closes = history.map((h) => h.close);
    const last = closes[closes.length - 1]!;
    const prev = closes[closes.length - 2] ?? null;

    const quote = await withRetry(
      () => yahooFinance.quote(symbol),
      2,
      500
    ).catch(() => null);
    const livePrice =
      typeof quote?.regularMarketPrice === "number"
        ? quote.regularMarketPrice
        : last;
    const currency =
      typeof quote?.currency === "string" ? quote.currency : "USD";

    return {
      snapshot: {
        ticker: symbol,
        currency,
        price: livePrice,
        previousClose: prev,
        changePct:
          prev != null
            ? Number((((livePrice - prev) / prev) * 100).toFixed(2))
            : null,
        asOf: new Date().toISOString(),
        source: "yahoo",
      },
      streak7: computeStreak(closes, 7),
      streak30: computeStreak(closes, 30),
      history,
    };
  } catch (err) {
    console.warn("[price] Yahoo falló por completo, usando demo:", err);
    return demoPriceAnalysis(symbol);
  }
}
