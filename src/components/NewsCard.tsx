import type { ScoredNewsItem } from "@/lib/types";

const DIR = {
  up: { label: "Alcista", className: "text-emerald-300" },
  down: { label: "Bajista", className: "text-rose-300" },
  neutral: { label: "Neutral", className: "text-slate-300" },
} as const;

export function NewsCard({ item }: { item: ScoredNewsItem }) {
  const dir = DIR[item.direction];
  const scoreColor =
    item.score >= 8
      ? "bg-emerald-500 text-slate-950"
      : item.score >= 6
        ? "bg-amber-400 text-slate-950"
        : "bg-slate-500 text-white";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-600">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-bold ${scoreColor}`}
          >
            {item.score}
          </span>
          <span className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300">
            {item.scope === "macro" ? "Macro / sector" : "Empresa"}
          </span>
          <span className={`rounded-lg px-2 py-1 text-xs font-medium ${dir.className}`}>
            {dir.label}
          </span>
        </div>
        <time className="shrink-0 text-xs text-slate-500">
          {new Date(item.publishedAt).toLocaleDateString("es-CO")}
        </time>
      </div>
      <h3 className="mt-3 text-base font-semibold text-white">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-300"
        >
          {item.title}
        </a>
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.summary}</p>
      <p className="mt-3 text-sm text-slate-300">
        <span className="font-medium text-slate-200">Por qué importa: </span>
        {item.explanation}
      </p>
      <p className="mt-2 text-xs text-slate-500">{item.source}</p>
    </article>
  );
}
