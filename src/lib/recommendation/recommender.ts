import type {
  CompanyProfile,
  PositionContext,
  PriceAnalysis,
  Recommendation,
  ScoredNewsItem,
} from "../types";
import { hasOpenAIKey } from "../openai-config";
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
  profile: CompanyProfile,
  position?: PositionContext
): Promise<RecommendResult> {
  if (hasOpenAIKey()) {
    const key = process.env.OPENAI_API_KEY!.trim();
    const recommendation = await recommendWithOpenAI(
      news,
      price,
      profile,
      key,
      position
    );
    return { recommendation, recommender: "openai" };
  }
  return {
    recommendation: recommendHeuristic(news, price, position),
    recommender: "heuristic",
  };
}
