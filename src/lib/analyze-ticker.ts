import { getCompanyProfile } from "@/lib/company-context";
import { fetchNews } from "@/lib/news/provider";
import { fetchPriceAnalysis } from "@/lib/price/price-service";
import { buildRecommendation } from "@/lib/recommendation/recommender";
import { scoreNews } from "@/lib/scoring/news-scorer";
import type { AnalyzeResponse } from "@/lib/types";

export async function analyzeTicker(tickerRaw: string): Promise<AnalyzeResponse> {
  const ticker = tickerRaw.trim().toUpperCase();
  const profile = getCompanyProfile(ticker);
  const [price, newsResult] = await Promise.all([
    fetchPriceAnalysis(ticker),
    fetchNews(ticker),
  ]);

  const { news, scorer } = await scoreNews(newsResult.items, profile);
  const { recommendation, recommender } = await buildRecommendation(
    news,
    price,
    profile
  );

  return {
    ticker,
    company: profile,
    price,
    news,
    recommendation,
    meta: {
      newsProvider: newsResult.provider,
      priceSource: price.snapshot.source,
      scorer,
      recommender,
      generatedAt: new Date().toISOString(),
    },
  };
}
