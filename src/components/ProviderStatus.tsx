"use client";

import { useEffect, useState } from "react";

interface HealthResponse {
  ok: boolean;
  providers: {
    price: { active: string; note: string; fallback?: string };
    news: { active: string; configured: boolean; note: string };
    scoring: {
      active: string;
      configured: boolean;
      model: string | null;
      note: string;
    };
  };
}

export function ProviderStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) return;
        const json = (await res.json()) as HealthResponse;
        if (!cancelled) setHealth(json);
      } catch {
        /* silencioso */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!health) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="h-5 w-28 animate-pulse rounded-full bg-slate-800" />
        <span className="h-5 w-24 animate-pulse rounded-full bg-slate-800" />
        <span className="h-5 w-20 animate-pulse rounded-full bg-slate-800" />
      </div>
    );
  }

  const { price, news, scoring } = health.providers;
  const pills = [
    {
      label: `Precio: ${price.active}`,
      ok: true,
      title: price.note,
    },
    {
      label: `Noticias: ${news.active}`,
      ok: news.active !== "mock" && news.active !== "demo",
      title: news.note,
    },
    {
      label: scoring.model
        ? `IA: ${scoring.active} (${scoring.model})`
        : `IA: ${scoring.active}`,
      ok: scoring.configured,
      title: scoring.note,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-medium text-slate-500">Proveedores</span>
      {pills.map((p) => (
        <span
          key={p.label}
          title={p.title}
          className={`rounded-full border px-2.5 py-1 font-medium ${
            p.ok
              ? "border-emerald-700/60 bg-emerald-500/10 text-emerald-300"
              : "border-slate-700 bg-slate-800/60 text-slate-400"
          }`}
        >
          <span
            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
              p.ok ? "bg-emerald-400" : "bg-slate-500"
            }`}
          />
          {p.label}
        </span>
      ))}
    </div>
  );
}
