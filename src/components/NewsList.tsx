import type { ScoredNewsItem } from "@/lib/types";
import { NewsCard } from "./NewsCard";

export function NewsList({ news }: { news: ScoredNewsItem[] }) {
  if (news.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-10 text-center">
        <p className="text-base font-medium text-slate-300">
          Sin noticias con score ≥ 5
        </p>
        <p className="mt-2 text-sm text-slate-500">
          El lote actual no superó el umbral de impacto. Prueba otro ticker o
          vuelve más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {news.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
