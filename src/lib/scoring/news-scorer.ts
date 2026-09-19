import type { CompanyProfile, RawNewsItem, ScoredNewsItem } from "../types";
import { scoreNewsHeuristic } from "./heuristic";
import { scoreNewsWithOpenAI } from "./openai-scorer";

export type ScorerName = "openai" | "heuristic";

export interface ScoreResult {
  news: ScoredNewsItem[];
  scorer: ScorerName;
}

export async function scoreNews(
  items: RawNewsItem[],
  profile: CompanyProfile
): Promise<ScoreResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (key) {
    const news = await scoreNewsWithOpenAI(items, profile, key);
    return { news, scorer: "openai" };
  }
  return { news: scoreNewsHeuristic(items, profile), scorer: "heuristic" };
}
