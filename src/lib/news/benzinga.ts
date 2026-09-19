import type { RawNewsItem } from "../types";

interface BenzingaNewsRow {
  id?: number | string;
  title?: string;
  teaser?: string;
  body?: string;
  url?: string;
  created?: string;
  updated?: string;
  author?: string;
  stocks?: Array<{ name?: string }>;
}

/**
 * Cliente ligero de Benzinga News API.
 * Requiere BENZINGA_API_KEY. Si falla, el caller debe hacer fallback a mock.
 */
export async function fetchBenzingaNews(
  ticker: string,
  apiKey: string
): Promise<RawNewsItem[]> {
  const symbol = ticker.trim().toUpperCase();
  const url = new URL("https://api.benzinga.com/api/v2/news");
  url.searchParams.set("token", apiKey);
  url.searchParams.set("tickers", symbol);
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("displayOutput", "headline");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Benzinga HTTP ${res.status}`);
  }

  const data = (await res.json()) as BenzingaNewsRow[] | { error?: string };
  if (!Array.isArray(data)) {
    throw new Error("Benzinga: respuesta inesperada");
  }

  return data.map((row, idx) => {
    const tickers =
      row.stocks
        ?.map((s) => (s.name ?? "").toUpperCase())
        .filter(Boolean) ?? [];
    const title = row.title ?? "(sin título)";
    const summary = row.teaser || row.body || title;
    return {
      id: String(row.id ?? `bz-${symbol}-${idx}`),
      title,
      summary: summary.slice(0, 600),
      url: row.url ?? "https://www.benzinga.com/",
      publishedAt: row.created || row.updated || new Date().toISOString(),
      source: row.author ? `Benzinga / ${row.author}` : "Benzinga",
      tickers,
      isMacroHint: tickers.length === 0,
    } satisfies RawNewsItem;
  });
}
