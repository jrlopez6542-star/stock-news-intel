"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoardCard, RecommendationAction } from "@/lib/types";
import { DEFAULT_WATCHLIST } from "@/lib/watchlist";

type ColumnKey = "comprar" | "vender" | "mantener";

const COLUMNS: {
  key: ColumnKey;
  title: string;
  subtitle: string;
  match: (c: BoardCard) => boolean;
  tone: string;
  header: string;
}[] = [
  {
    key: "comprar",
    title: "Comprar",
    subtitle: "Comprar / aumentar",
    match: (c) => c.boardColumn === "comprar",
    tone: "border-emerald-500/35 bg-emerald-500/[0.06]",
    header: "text-emerald-300",
  },
  {
    key: "vender",
    title: "Vender",
    subtitle: "Salir o reducir",
    match: (c) => c.boardColumn === "vender" || c.boardColumn === "reducir",
    tone: "border-rose-500/35 bg-rose-500/[0.06]",
    header: "text-rose-300",
  },
  {
    key: "mantener",
    title: "Mantener",
    subtitle: "Sin sesgo claro",
    match: (c) => c.boardColumn === "mantener",
    tone: "border-sky-500/35 bg-sky-500/[0.06]",
    header: "text-sky-300",
  },
];

function mapAction(action: RecommendationAction | string): {
  boardColumn: BoardCard["boardColumn"];
  boardLabel: string;
  sourceAction: RecommendationAction;
} {
  if (action === "comprar" || action === "invertir") {
    return { boardColumn: "comprar", boardLabel: "Comprar", sourceAction: action as RecommendationAction };
  }
  if (action === "aumentar") {
    return { boardColumn: "comprar", boardLabel: "Aumentar", sourceAction: "aumentar" };
  }
  if (action === "salir" || action === "retirar") {
    return { boardColumn: "vender", boardLabel: action === "salir" ? "Salir" : "Vender", sourceAction: action as RecommendationAction };
  }
  if (action === "reducir") {
    return { boardColumn: "reducir", boardLabel: "Reducir", sourceAction: "reducir" };
  }
  return { boardColumn: "mantener", boardLabel: "Mantener", sourceAction: "mantener" };
}

async function fetchCard(ticker: string): Promise<BoardCard> {
  const res = await fetch(`/api/analyze?ticker=${encodeURIComponent(ticker)}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.details || json.error || "Error");
  }
  const mapped = mapAction(json.recommendation?.action);
  return {
    ticker: json.ticker,
    companyName: json.company?.name ?? json.ticker,
    boardColumn: mapped.boardColumn,
    boardLabel: mapped.boardLabel,
    sourceAction: mapped.sourceAction,
    rationale: json.recommendation?.rationale ?? "",
    confidence: json.recommendation?.confidence ?? 0.5,
    price: json.price?.snapshot,
    factors: (json.recommendation?.factors ?? []).slice(0, 3),
    meta: json.meta,
  };
}

function formatPrice(card: BoardCard): string {
  const { price, currency, changePct } = card.price;
  const cur = currency || "USD";
  const px = price.toLocaleString("es-CO", {
    style: "currency",
    currency: cur === "USD" ? "USD" : cur,
    maximumFractionDigits: 2,
  });
  const ch =
    changePct == null
      ? ""
      : ` ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
  return `${px}${ch}`;
}

function BoardCardView({
  card,
  onSelect,
  highlight,
}: {
  card: BoardCard;
  onSelect?: (ticker: string) => void;
  highlight?: boolean;
}) {
  const pct = Math.round(card.confidence * 100);
  const isReduce = card.boardColumn === "reducir";
  const change = card.price.changePct;
  const changeColor =
    change == null
      ? "text-slate-400"
      : change >= 0
        ? "text-emerald-400"
        : "text-rose-400";

  return (
    <article
      className={`rounded-xl border bg-slate-950/50 p-3.5 shadow-sm shadow-black/20 transition hover:border-slate-600 ${
        highlight
          ? "border-emerald-500/50 ring-1 ring-emerald-500/30"
          : "border-slate-800/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={() => onSelect?.(card.ticker)}
            className="text-left text-lg font-bold tracking-wide text-white hover:text-emerald-300"
          >
            {card.ticker}
          </button>
          <p className="text-xs text-slate-500 line-clamp-1">{card.companyName}</p>
        </div>
        <span
          className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            card.boardColumn === "comprar"
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : card.boardColumn === "mantener"
                ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                : isReduce
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border-rose-500/40 bg-rose-500/15 text-rose-300"
          }`}
        >
          {card.boardLabel}
        </span>
      </div>
      <p className={`mt-2 text-sm font-medium tabular-nums ${changeColor}`}>
        {formatPrice(card)}
      </p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Confianza</span>
        <span className="font-semibold tabular-nums text-slate-200">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${
            card.boardColumn === "comprar"
              ? "bg-emerald-400"
              : card.boardColumn === "mantener"
                ? "bg-sky-400"
                : isReduce
                  ? "bg-amber-400"
                  : "bg-rose-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-slate-400 line-clamp-3">
        {card.rationale}
      </p>
    </article>
  );
}

interface Props {
  currentTicker?: string;
  onSelectTicker?: (ticker: string) => void;
}

export function RecommendationsBoard({
  currentTicker,
  onSelectTicker,
}: Props) {
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [errors, setErrors] = useState<{ ticker: string; error: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const known = useRef(new Set<string>());
  const bootstrapped = useRef(false);

  const upsertCard = useCallback((card: BoardCard) => {
    known.current.add(card.ticker);
    setCards((prev) => {
      const rest = prev.filter((c) => c.ticker !== card.ticker);
      return [...rest, card].sort((a, b) => b.confidence - a.confidence);
    });
  }, []);

  const analyzeMany = useCallback(
    async (tickers: string[]) => {
      const list = [...new Set(tickers.map((t) => t.toUpperCase()))];
      if (list.length === 0) return;

      setLoading(true);
      setError(null);
      setProgress({ done: 0, total: list.length });

      const concurrency = 3;
      let next = 0;
      let done = 0;
      const localErrors: { ticker: string; error: string }[] = [];

      async function worker() {
        while (true) {
          const i = next++;
          if (i >= list.length) return;
          const ticker = list[i]!;
          try {
            const card = await fetchCard(ticker);
            upsertCard(card);
          } catch (e) {
            localErrors.push({
              ticker,
              error: e instanceof Error ? e.message : "Error",
            });
          } finally {
            done += 1;
            setProgress({ done, total: list.length });
          }
        }
      }

      try {
        await Promise.all(
          Array.from({ length: Math.min(concurrency, list.length) }, () =>
            worker()
          )
        );
        setErrors(localErrors);
        if (localErrors.length === list.length) {
          setError(
            localErrors.map((e) => `${e.ticker}: ${e.error}`).join(" · ")
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar el tablero");
      } finally {
        setLoading(false);
      }
    },
    [upsertCard]
  );

  // Carga inicial de la watchlist (una vez)
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void analyzeMany([...DEFAULT_WATCHLIST]);
  }, [analyzeMany]);

  // Si el ticker actual no está en el tablero, analizarlo solo
  useEffect(() => {
    const t = currentTicker?.trim().toUpperCase();
    if (!t || !bootstrapped.current) return;
    if (known.current.has(t)) return;
    void analyzeMany([t]);
  }, [currentTicker, analyzeMany]);

  const grouped = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        items: cards.filter(col.match),
      })),
    [cards]
  );

  const watchlistLabel = useMemo(() => {
    const set = new Set<string>(DEFAULT_WATCHLIST);
    if (currentTicker) set.add(currentTicker.toUpperCase());
    return [...set].join(", ");
  }, [currentTicker]);

  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/10"
      aria-label="Tablero comprar y vender"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-white">
              Tablero Comprar / Vender
            </h2>
            <span className="rounded-md border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Watchlist
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Señales sobre tickers líquidos
            {currentTicker ? ` · ticker activo ${currentTicker.toUpperCase()}` : ""}
            . Invertir → Comprar · Retirar/Reducir → Vender · Mantener
            neutral.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            known.current.clear();
            setCards([]);
            void analyzeMany([
              ...DEFAULT_WATCHLIST,
              ...(currentTicker ? [currentTicker.toUpperCase()] : []),
            ]);
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-emerald-400" />
              {progress.done}/{progress.total}
            </>
          ) : (
            "Actualizar tablero"
          )}
        </button>
      </div>

      {loading && (
        <div className="mt-4" aria-live="polite">
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>Analizando en paralelo (concurrencia 3)…</span>
            <span className="tabular-nums">
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-300"
              style={{
                width: `${
                  progress.total
                    ? Math.round((progress.done / progress.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {error && cards.length === 0 && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {grouped.map((col) => (
          <div
            key={col.key}
            className={`rounded-2xl border p-3.5 ${col.tone}`}
          >
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <div>
                <h3 className={`text-base font-bold ${col.header}`}>
                  {col.title}
                </h3>
                <p className="text-[11px] text-slate-500">{col.subtitle}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs tabular-nums text-slate-300">
                {col.items.length}
              </span>
            </div>
            {col.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700/80 px-3 py-8 text-center text-xs text-slate-500">
                {loading ? "Cargando…" : "Sin señales en esta columna"}
              </p>
            ) : (
              <div className="grid gap-2.5">
                {col.items.map((card) => (
                  <BoardCardView
                    key={card.ticker}
                    card={card}
                    onSelect={onSelectTicker}
                    highlight={
                      !!currentTicker &&
                      card.ticker === currentTicker.toUpperCase()
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {errors.length > 0 && (
        <p className="mt-3 text-xs text-amber-400/90">
          Parcial: {errors.map((e) => e.ticker).join(", ")} no respondieron.
        </p>
      )}

      <p className="mt-4 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
        Señales educativas del desk — no son asesoría financiera. Watchlist:{" "}
        {watchlistLabel}.
      </p>
    </section>
  );
}
