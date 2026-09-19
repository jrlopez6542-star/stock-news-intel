"use client";

import { useEffect, useState } from "react";

interface HealthResponse {
  ok: boolean;
  providers: {
    price: { active: string; note: string };
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
        /* silencioso: el dashboard sigue con meta del analyze */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!health) return null;

  const { price, news, scoring } = health.providers;
  const pills = [
    { label: `Precio: ${price.active}`, ok: true },
    {
      label: `Noticias: ${news.active}`,
      ok: news.configured,
    },
    {
      label: scoring.model
        ? `IA: ${scoring.active} (${scoring.model})`
        : `IA: ${scoring.active}`,
      ok: scoring.configured,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-slate-500">Proveedores:</span>
      {pills.map((p) => (
        <span
          key={p.label}
          title={
            p.label.startsWith("Noticias")
              ? news.note
              : p.label.startsWith("IA")
                ? scoring.note
                : price.note
          }
          className={`rounded-full border px-2 py-1 ${
            p.ok
              ? "border-emerald-700/60 bg-emerald-500/10 text-emerald-300"
              : "border-slate-700 bg-slate-800/60 text-slate-400"
          }`}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}
