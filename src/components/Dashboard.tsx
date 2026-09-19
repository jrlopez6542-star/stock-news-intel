"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { NewsList } from "./NewsList";
import { PricePanel } from "./PricePanel";
import { RecommendationPanel } from "./RecommendationPanel";
import { TickerSearch } from "./TickerSearch";

export function Dashboard() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (t: string) => {
    setTicker(t);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze?ticker=${encodeURIComponent(t)}`);
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <p className="text-sm font-medium text-emerald-400">
          Stock News Intel · es-CO
        </p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Inteligencia de noticias bursátiles
        </h1>
        <p className="max-w-2xl text-slate-400">
          Precio y rachas, noticias puntuadas 1–10 por impacto (empresa + macro),
          y una segunda pasada de IA con recomendación: invertir / mantener /
          reducir / retirar.
        </p>
        <TickerSearch initial={ticker} onSearch={load} loading={loading} />
      </header>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center text-slate-400">
          Cargando análisis de {ticker}…
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-700 px-2 py-1">
              Noticias: {data.meta.newsProvider}
            </span>
            <span className="rounded-full border border-slate-700 px-2 py-1">
              Score: {data.meta.scorer}
            </span>
            <span className="rounded-full border border-slate-700 px-2 py-1">
              Recomendación: {data.meta.recommender}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <PricePanel
                price={data.price}
                companyName={data.company.name}
              />
              <section>
                <div className="mb-3 flex items-end justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Noticias filtradas
                    </h2>
                    <p className="text-sm text-slate-400">
                      Paso 1 · Solo score ≥ 5 · empresa y macro
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">
                    {data.news.length} ítems
                  </span>
                </div>
                <NewsList news={data.news} />
              </section>
            </div>
            <div className="space-y-6 lg:col-span-2">
              <RecommendationPanel recommendation={data.recommendation} />
              <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Contexto de empresa
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {data.company.businessModel}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Sector: {data.company.sector}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Dependencias: {data.company.dependencies.slice(0, 3).join(" · ")}
                </p>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
