import type { CompanyProfile, RawNewsItem, ScoredNewsItem } from "../types";
import { hasOpenAIKey } from "../openai-config";
import {
  ensureNewsInSpanish,
  labelNewsLanguage,
} from "../news/translate-es";
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
    let news = await scoreNewsWithOpenAI(items, profile, key);
    // Traduce títulos/resúmenes EN → ES en lote (si hace falta)
    news = await ensureNewsInSpanish(news, key);
    return { news, scorer: "openai" };
  }
  return {
    news: labelNewsLanguage(scoreNewsHeuristic(items, profile)),
    scorer: "heuristic",
  };
}
