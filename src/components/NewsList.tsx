import type { ScoredNewsItem } from "@/lib/types";
import { NewsCard } from "./NewsCard";

export function NewsList({ news }: { news: ScoredNewsItem[] }) {
  if (news.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
        No hay noticias con score ≥ 5 para este ticker en el lote actual.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {news.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
