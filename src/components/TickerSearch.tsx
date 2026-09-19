"use client";

import { FormEvent, useEffect, useState } from "react";

const SUGGESTIONS = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "GOOGL", "META", "AMD"];

interface Props {
  initial?: string;
  onSearch: (ticker: string) => void;
  loading?: boolean;
}

export function TickerSearch({ initial = "AAPL", onSearch, loading }: Props) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = value.trim().toUpperCase();
    if (t) onSearch(t);
  }

  return (
    <div className="w-full">
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label className="sr-only" htmlFor="ticker">
          Símbolo bursátil
        </label>
        <div className="relative w-full sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
            $
          </span>
          <input
            id="ticker"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="Ej. AAPL"
            maxLength={10}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-8 pr-4 text-lg tracking-widest text-white placeholder:text-slate-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
              Analizando…
            </>
          ) : (
            "Analizar"
          )}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Rápidos:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => {
              setValue(s);
              onSearch(s);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              value === s
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
            } disabled:opacity-50`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
