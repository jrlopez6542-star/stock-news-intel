import type {
  CompanyProfile,
  PriceAnalysis,
  Recommendation,
  ScoredNewsItem,
} from "../types";
import { recommendHeuristic } from "./heuristic";
import { recommendWithOpenAI } from "./openai-recommender";

export type RecommenderName = "openai" | "heuristic";

export interface RecommendResult {
  recommendation: Recommendation;
  recommender: RecommenderName;
}

export async function buildRecommendation(
  news: ScoredNewsItem[],
  price: PriceAnalysis,
  profile: CompanyProfile
): Promise<RecommendResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (key) {
    const recommendation = await recommendWithOpenAI(
      news,
      price,
      profile,
      key
    );
    return { recommendation, recommender: "openai" };
  }
  return {
    recommendation: recommendHeuristic(news, price),
    recommender: "heuristic",
  };
}
