"use client";

import { FormEvent, useState } from "react";

const SUGGESTIONS = ["AAPL", "NVDA", "TSLA", "MSFT"];

interface Props {
  initial?: string;
  onSearch: (ticker: string) => void;
  loading?: boolean;
}

export function TickerSearch({ initial = "AAPL", onSearch, loading }: Props) {
  const [value, setValue] = useState(initial);

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
        <input
          id="ticker"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="Ej. AAPL"
          maxLength={10}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg tracking-wide text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analizando…" : "Analizar"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-slate-400">Demo:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setValue(s);
              onSearch(s);
            }}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-300"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
