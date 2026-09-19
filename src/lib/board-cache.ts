import type { BoardResponse } from "./types";

const TTL_MS = 90_000; // ~1.5 min — breve para no saturar proveedores

interface CacheEntry {
  expires: number;
  value: BoardResponse;
}

const g = globalThis as unknown as {
  __stockNewsBoardCache?: Map<string, CacheEntry>;
};

function store(): Map<string, CacheEntry> {
  if (!g.__stockNewsBoardCache) g.__stockNewsBoardCache = new Map();
  return g.__stockNewsBoardCache;
}

export function boardCacheGet(key: string): BoardResponse | null {
  const hit = store().get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store().delete(key);
    return null;
  }
  return { ...hit.value, meta: { ...hit.value.meta, cached: true } };
}

export function boardCacheSet(key: string, value: BoardResponse): void {
  store().set(key, { expires: Date.now() + TTL_MS, value });
}

export function boardCacheKey(tickers: string[]): string {
  return [...tickers].map((t) => t.toUpperCase()).sort().join(",");
}
