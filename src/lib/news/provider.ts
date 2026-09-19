import type { RawNewsItem } from "../types";
import { fetchBenzingaNews } from "./benzinga";
import { getMockNews } from "./mock";

export type NewsProviderName = "benzinga" | "demo";

export interface NewsFetchResult {
  items: RawNewsItem[];
  provider: NewsProviderName;
}

/**
 * Si BENZINGA_API_KEY está definida, usa Benzinga; si falla o no hay key, demo/mock.
 */
export async function fetchNews(ticker: string): Promise<NewsFetchResult> {
  const key = process.env.BENZINGA_API_KEY?.trim();
  if (key) {
    try {
      const items = await fetchBenzingaNews(ticker, key);
      if (items.length > 0) {
        return { items, provider: "benzinga" };
      }
    } catch (err) {
      console.warn("[news] Benzinga falló, usando demo:", err);
    }
  }
  return { items: getMockNews(ticker), provider: "demo" };
}
