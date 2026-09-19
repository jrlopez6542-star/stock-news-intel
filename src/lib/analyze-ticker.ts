import { fetchCatalysts } from "@/lib/catalysts/calendar";
import { getCompanyProfile } from "@/lib/company-context";
import { fetchNews } from "@/lib/news/provider";
import { fetchPriceAnalysis } from "@/lib/price/price-service";
import { sanitizePositionContext } from "@/lib/position-storage";
import { buildRecommendation } from "@/lib/recommendation/recommender";
import { scoreNews } from "@/lib/scoring/news-scorer";
import type { AnalyzeResponse, PositionContext } from "@/lib/types";

export async function analyzeTicker(
  tickerRaw: string,
  positionRaw?: unknown
): Promise<AnalyzeResponse> {
  const ticker = tickerRaw.trim().toUpperCase();
  const position: PositionContext | undefined =
    sanitizePositionContext(positionRaw);
  const profile = getCompanyProfile(ticker);
  const [price, newsResult, catalystsResult] = await Promise.all([
    fetchPriceAnalysis(ticker),
    fetchNews(ticker),
    fetchCatalysts(ticker, profile),
  ]);

  const { news, scorer } = await scoreNews(newsResult.items, profile);
  const { recommendation, recommender } = await buildRecommendation(
    news,
    price,
    profile,
    position
  );

  return {
    ticker,
    company: profile,
    price,
    news,
    recommendation,
    catalysts: catalystsResult.items,
    meta: {
      newsProvider: newsResult.provider,
      priceSource: price.snapshot.source,
      scorer,
      recommender,
      generatedAt: new Date().toISOString(),
      positionAware: Boolean(position),
    },
  };
}
