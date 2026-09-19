import type { ScoredNewsItem } from "@/lib/types";

const DIR = {
  up: {
    label: "Alcista",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  down: {
    label: "Bajista",
    className: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  },
  neutral: {
    label: "Neutral",
    className: "border-slate-600 bg-slate-800/60 text-slate-300",
  },
} as const;

export function NewsCard({ item }: { item: ScoredNewsItem }) {
  const dir = DIR[item.direction];
  const scoreColor =
    item.score >= 8
      ? "bg-emerald-500 text-slate-950 ring-emerald-400/40"
      : item.score >= 6
        ? "bg-amber-400 text-slate-950 ring-amber-300/40"
        : "bg-slate-500 text-white ring-slate-400/30";

  return (
    <article className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-600 hover:bg-slate-900/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-bold ring-1 ${scoreColor}`}
            title="Score de impacto 1–10"
          >
            {item.score}
          </span>
          <span
            className={`rounded-lg border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              item.scope === "macro"
                ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                : "border-sky-500/40 bg-sky-500/10 text-sky-300"
            }`}
          >
            {item.scope === "macro" ? "Macro / sector" : "Empresa"}
          </span>
          <span
            className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${dir.className}`}
          >
            {dir.label}
          </span>
        </div>
        <time className="shrink-0 text-xs text-slate-500">
          {new Date(item.publishedAt).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug text-white">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-300"
        >
          {item.title}
          <span className="ml-1 inline-block text-slate-600 transition group-hover:text-emerald-500/80">
            ↗
          </span>
        </a>
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400 line-clamp-3">
        {item.summary}
      </p>
      <p className="mt-3 text-sm text-slate-300">
        <span className="font-medium text-slate-200">Por qué importa: </span>
        {item.explanation}
      </p>
      <p className="mt-2 text-xs text-slate-500">{item.source}</p>
    </article>
  );
}
