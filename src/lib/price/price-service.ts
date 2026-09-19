import yahooFinance from "yahoo-finance2";
import type {
  DailyBar,
  PriceAnalysis,
  PriceDirection,
  StreakResult,
} from "../types";

// Evita spam de avisos en logs del servidor
try {
  yahooFinance.suppressNotices(["yahooSurvey", "ripHistorical"]);
} catch {
  /* ignore en versiones sin suppressNotices */
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

async function fetchDailyBars(symbol: string): Promise<DailyBar[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 60);

  // Prefer chart() (API actual de Yahoo); fallback a historical()
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
    const history = await fetchDailyBars(symbol);
    if (history.length < 5) {
      return demoPriceAnalysis(symbol);
    }

    const closes = history.map((h) => h.close);
    const last = closes[closes.length - 1]!;
    const prev = closes[closes.length - 2] ?? null;

    const quote = await yahooFinance.quote(symbol).catch(() => null);
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
  } catch {
    return demoPriceAnalysis(symbol);
  }
}
