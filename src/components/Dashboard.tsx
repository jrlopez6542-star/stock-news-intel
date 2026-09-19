"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadPosition } from "@/lib/position-storage";
import type { AnalyzeResponse, PositionContext } from "@/lib/types";
import { CatalystsPanel } from "./CatalystsPanel";
import { NewsList } from "./NewsList";
import { PositionContextPanel } from "./PositionContextPanel";
import { PricePanel } from "./PricePanel";
import { RecommendationPanel } from "./RecommendationPanel";
import { RecommendationsBoard } from "./RecommendationsBoard";
import { ProviderStatus } from "./ProviderStatus";
import { TickerSearch } from "./TickerSearch";

function LoadingSkeleton({ ticker }: { ticker: string }) {
  return (
    <div className="space-y-6" aria-busy aria-live="polite">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
            <div className="h-9 w-24 animate-pulse rounded bg-slate-800" />
            <div className="h-12 w-48 animate-pulse rounded bg-slate-800" />
          </div>
          <div className="grid w-full gap-3 sm:w-56">
            <div className="h-20 animate-pulse rounded-xl bg-slate-800" />
            <div className="h-20 animate-pulse rounded-xl bg-slate-800" />
          </div>
        </div>
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-800/80" />
      </div>
      <p className="text-center text-sm text-slate-500">
        Consultando precio, noticias y scoring de{" "}
        <span className="font-semibold text-slate-300">{ticker}</span>…
      </p>
    </div>
  );
}

function newsProviderLabel(p: string) {
  if (p === "benzinga") return "Benzinga";
  if (p === "yahoo") return "Yahoo Finance";
  return "Demo (mock)";
}

export function Dashboard() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const positionRef = useRef<PositionContext>({});

  const load = useCallback(async (t: string, position?: PositionContext) => {
    setTicker(t);
    setLoading(true);
    setError(null);
    const pos = position ?? loadPosition(t);
    positionRef.current = pos;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: t, position: pos }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.details || json.error || "Error al analizar");
      }
      setData(json as AnalyzeResponse);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("AAPL");
  }, [load]);

  const onPositionChange = useCallback(
    (ctx: PositionContext) => {
      positionRef.current = ctx;
    },
    []
  );

  const reanalyzeWithPosition = useCallback(() => {
    void load(ticker, positionRef.current);
  }, [load, ticker]);

  const priceDemo = data?.meta.priceSource === "demo";
  const newsDemo = data?.meta.newsProvider === "demo";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Trading desk
            </span>
            <span className="text-xs text-slate-500">es-CO · Stock News Intel</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Inteligencia de noticias bursátiles
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Escritorio de análisis: tablero Comprar / Vender, posición y
              horizonte, niveles (entrada / stop / objetivo), catalizadores,
              noticias en español con score y recomendación educativa
              (comprar · aumentar · mantener · reducir · salir).
            </p>
          </div>
          <TickerSearch initial={ticker} onSearch={load} loading={loading} />
          <ProviderStatus />
        </div>
      </header>

      <RecommendationsBoard
        currentTicker={ticker}
        onSelectTicker={(t) => void load(t)}
      />

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200"
        >
          <p className="font-semibold">No se pudo completar el análisis</p>
          <p className="mt-1 text-sm opacity-90">{error}</p>
          <button
            type="button"
            onClick={() => void load(ticker)}
            className="mt-3 rounded-lg border border-rose-400/40 px-3 py-1.5 text-sm hover:bg-rose-500/20"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading && !data && <LoadingSkeleton ticker={ticker} />}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Este análisis:</span>
            <span
              className={`rounded-full border px-2.5 py-1 ${
                priceDemo
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              Precio: {priceDemo ? "demo" : "Yahoo"}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 ${
                newsDemo
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              Noticias: {newsProviderLabel(data.meta.newsProvider)}
            </span>
            <span className="rounded-full border border-slate-700 px-2.5 py-1 text-slate-300">
              Score: {data.meta.scorer}
            </span>
            <span className="rounded-full border border-slate-700 px-2.5 py-1 text-slate-300">
              Reco: {data.meta.recommender}
            </span>
            {data.meta.positionAware && (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                Con posición
              </span>
            )}
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
                Actualizando…
              </span>
            )}
          </div>

          <div
            className={`grid gap-6 lg:grid-cols-5 ${loading ? "opacity-70" : ""}`}
          >
            <div className="space-y-6 lg:col-span-3">
              <PricePanel
                price={data.price}
                companyName={data.company.name}
              />
              <PositionContextPanel
                ticker={data.ticker}
                onChange={onPositionChange}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={reanalyzeWithPosition}
                  disabled={loading}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  Recalcular recomendación con posición
                </button>
              </div>
              <section>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Noticias filtradas
                    </h2>
                    <p className="text-sm text-slate-400">
                      Paso 1 · Score ≥ 5 · títulos/resúmenes en español cuando
                      hay OpenAI
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-400">
                    {data.news.length} ítem{data.news.length === 1 ? "" : "s"}
                  </span>
                </div>
                <NewsList news={data.news} />
              </section>
            </div>
            <div className="space-y-6 lg:col-span-2">
              <RecommendationPanel recommendation={data.recommendation} />
              <CatalystsPanel
                catalysts={data.catalysts ?? []}
                ticker={data.ticker}
              />
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Contexto de empresa
                </h3>
                <p className="mt-1 text-lg font-semibold text-white">
                  {data.company.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {data.company.sector}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {data.company.businessModel}
                </p>
                <div className="mt-4 grid gap-3 text-xs text-slate-400">
                  <div>
                    <p className="font-medium text-slate-300">Fortalezas</p>
                    <p className="mt-1">
                      {data.company.strengths.slice(0, 3).join(" · ")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-300">Dependencias</p>
                    <p className="mt-1">
                      {data.company.dependencies.slice(0, 3).join(" · ")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-300">Competidores</p>
                    <p className="mt-1">
                      {data.company.competitors.slice(0, 4).join(" · ")}
                    </p>
                  </div>
                </div>
                <p className="mt-4 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
                  Generado{" "}
                  {new Date(data.meta.generatedAt).toLocaleString("es-CO")}
                </p>
              </section>
            </div>
          </div>
        </>
      )}

      {!loading && !data && !error && (
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400">
          Ingresa un ticker para comenzar el análisis.
        </div>
      )}

      <footer className="rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-center text-[11px] text-slate-500">
        Contenido educativo. No constituye asesoría financiera, recomendación de
        inversión ni oferta de valores.
      </footer>
    </div>
  );
}
