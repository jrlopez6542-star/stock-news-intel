/** Watchlist líquida por defecto para el tablero Comprar / Vender. */
export const DEFAULT_WATCHLIST = [
  "AAPL",
  "NVDA",
  "TSLA",
  "MSFT",
  "AMZN",
  "GOOGL",
  "META",
  "AMD",
] as const;

export type DefaultWatchTicker = (typeof DEFAULT_WATCHLIST)[number];

export function mergeWatchlist(
  extras: string[] = [],
  base: readonly string[] = DEFAULT_WATCHLIST
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...extras, ...base]) {
    const u = t.trim().toUpperCase();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}
