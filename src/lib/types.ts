/** Tipos compartidos del MVP de inteligencia de noticias bursátiles (es-CO). */

export type Ticker = string;

export type NewsScope = "company" | "macro";

export type PriceDirection = "up" | "down" | "neutral";

export type RecommendationAction =
  | "invertir"
  | "mantener"
  | "reducir"
  | "retirar";

export interface CompanyProfile {
  ticker: string;
  name: string;
  sector: string;
  businessModel: string;
  strengths: string[];
  dependencies: string[];
  competitors: string[];
  suppliers: string[];
  financialNotes: string;
  keywords: string[];
}

export interface DailyBar {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface PriceSnapshot {
  ticker: string;
  currency: string;
  price: number;
  previousClose: number | null;
  changePct: number | null;
  asOf: string;
  source: "yahoo" | "demo";
}

export interface StreakResult {
  days: number;
  direction: PriceDirection;
  length: number;
  closes: number[];
}

export interface PriceAnalysis {
  snapshot: PriceSnapshot;
  streak7: StreakResult;
  streak30: StreakResult;
  history: DailyBar[];
}

export interface RawNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  tickers: string[];
  /** Si el proveedor marca la noticia como macro/sectorial. */
  isMacroHint?: boolean;
}

export interface ScoredNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  scope: NewsScope;
  score: number; // 1–10
  direction: PriceDirection;
  explanation: string;
}

export interface Recommendation {
  action: RecommendationAction;
  rationale: string;
  confidence: number; // 0–1
  factors: string[];
}

export interface AnalyzeResponse {
  ticker: string;
  company: CompanyProfile;
  price: PriceAnalysis;
  news: ScoredNewsItem[];
  recommendation: Recommendation;
  meta: {
    newsProvider: "benzinga" | "demo";
    scorer: "openai" | "heuristic";
    recommender: "openai" | "heuristic";
    generatedAt: string;
  };
}

export interface AnalyzeError {
  error: string;
  details?: string;
}
