import type { CompanyProfile, RawNewsItem, ScoredNewsItem } from "../types";
import { hasOpenAIKey } from "../openai-config";
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
  if (hasOpenAIKey()) {
    const key = process.env.OPENAI_API_KEY!.trim();
    const news = await scoreNewsWithOpenAI(items, profile, key);
    // scoreNewsWithOpenAI ya hace fallback interno a heurística si falla la API
    return { news, scorer: "openai" };
  }
  return { news: scoreNewsHeuristic(items, profile), scorer: "heuristic" };
}
