import { NextRequest, NextResponse } from "next/server";
import { analyzeTicker } from "@/lib/analyze-ticker";
import {
  boardCacheGet,
  boardCacheKey,
  boardCacheSet,
} from "@/lib/board-cache";
import { toBoardAction } from "@/lib/recommendation/board-actions";
import { DEFAULT_WATCHLIST, mergeWatchlist } from "@/lib/watchlist";
import type { BoardCard, BoardResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Tablero puede tardar con varios tickers + OpenAI. */
export const maxDuration = 60;

const TICKER_RE = /^[A-Za-z.]{1,10}$/;
const DEFAULT_CONCURRENCY = 3;
const MAX_TICKERS = 12;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
    }
  }
  const n = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw = sp.get("tickers")?.trim();
  const extra = sp.get("include")?.trim();
  const concurrency = Math.min(
    6,
    Math.max(1, Number(sp.get("concurrency") || DEFAULT_CONCURRENCY) || DEFAULT_CONCURRENCY)
  );

  let requested: string[] = [...DEFAULT_WATCHLIST];
  if (raw) {
    requested = raw
      .split(/[,;\s]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
  }
  if (extra) {
    requested = mergeWatchlist(
      [extra.toUpperCase()],
      requested.length ? requested : DEFAULT_WATCHLIST
    );
  }

  const tickers = [...new Set(requested)]
    .filter((t) => TICKER_RE.test(t))
    .slice(0, MAX_TICKERS);

  if (tickers.length === 0) {
    return NextResponse.json(
      {
        error: "Sin tickers válidos",
        details: "Pasa tickers=AAPL,NVDA o usa la watchlist por defecto.",
      },
      { status: 400 }
    );
  }

  const cacheKey = boardCacheKey(tickers);
  const cached = boardCacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const errors: BoardResponse["errors"] = [];
  const cards: BoardCard[] = [];

  const settled = await mapPool(tickers, concurrency, async (ticker) => {
    try {
      const data = await analyzeTicker(ticker);
      const board = toBoardAction(data.recommendation.action);
      const card: BoardCard = {
        ticker: data.ticker,
        companyName: data.company.name,
        boardColumn: board.column,
        boardLabel: board.label,
        sourceAction: board.sourceAction,
        rationale: data.recommendation.rationale,
        confidence: data.recommendation.confidence,
        price: data.price.snapshot,
        factors: data.recommendation.factors.slice(0, 3),
        meta: data.meta,
      };
      return { ok: true as const, card };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      return { ok: false as const, ticker, error: message };
    }
  });

  for (const row of settled) {
    if (row.ok) cards.push(row.card);
    else errors.push({ ticker: row.ticker, error: row.error });
  }

  // Orden: comprar primero por confianza, luego reducir/vender, luego mantener
  const colOrder = { comprar: 0, reducir: 1, vender: 2, mantener: 3 } as const;
  cards.sort((a, b) => {
    const c = colOrder[a.boardColumn] - colOrder[b.boardColumn];
    if (c !== 0) return c;
    return b.confidence - a.confidence;
  });

  const body: BoardResponse = {
    tickers,
    cards,
    errors,
    meta: {
      cached: false,
      concurrency,
      generatedAt: new Date().toISOString(),
    },
  };

  if (cards.length > 0) {
    boardCacheSet(cacheKey, body);
  }

  return NextResponse.json(body);
}
