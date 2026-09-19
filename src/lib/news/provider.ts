import type { NewsProviderName, RawNewsItem } from "../types";
import { fetchBenzingaNews } from "./benzinga";
import { getMockNews } from "./mock";
import { fetchYahooNews } from "./yahoo";

export type { NewsProviderName };

export interface NewsFetchResult {
  items: RawNewsItem[];
  provider: NewsProviderName;
}

/**
 * Orden: Benzinga (si hay key) → Yahoo RSS/search (gratis) → mock solo como último recurso.
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
      console.warn("[news] Benzinga falló, probando Yahoo:", err);
    }
  }

  try {
    const items = await fetchYahooNews(ticker);
    if (items.length > 0) {
      return { items, provider: "yahoo" };
    }
  } catch (err) {
    console.warn("[news] Yahoo falló, usando mock:", err);
  }

  return { items: getMockNews(ticker), provider: "demo" };
}
