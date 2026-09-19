/** Tipos compartidos — inteligencia de noticias bursátiles (es-CO). */

export type Ticker = string;

export type NewsScope = "company" | "macro";

export type PriceDirection = "up" | "down" | "neutral";

/**
 * Acciones de consejo (con contexto de posición):
 * - comprar: sin posición / flat
 * - aumentar: ya hay posición y sesgo alcista
 * - mantener / reducir / salir
 * Aliases legacy: invertir→comprar, retirar→salir (tablero).
 */
export type RecommendationAction =
  | "comprar"
  | "aumentar"
  | "mantener"
  | "reducir"
  | "salir"
  | "invertir"
  | "retirar";

export type HorizonUnit = "dias" | "meses" | "anos";

export type RiskTolerance = "conservador" | "moderado" | "agresivo";

/** Contexto opcional de posición / horizonte del usuario (localStorage + API). */
export interface PositionContext {
  sharesHeld?: number | null;
  avgEntryPrice?: number | null;
  portfolioPct?: number | null;
  horizonValue?: number | null;
  horizonUnit?: HorizonUnit | null;
  riskTolerance?: RiskTolerance | null;
}

export interface RecommendationLevels {
  /** Rango textual p.ej. "172–178" */
  zonaEntrada: string | null;
  /** Precio de referencia de entrada si aplica */
  precioEntrada: number | null;
  stopSugerido: number | null;
  objetivo: number | null;
  /** Qué precio o noticia invalida la idea */
  invalidacion: string | null;
}

export type PriceSource = "yahoo" | "demo";

export type NewsProviderName = "benzinga" | "yahoo" | "demo";

export type CatalystType = "earnings" | "macro" | "company" | "other";

export interface CatalystItem {
  /** YYYY-MM-DD o fecha aproximada */
  date: string;
  type: CatalystType;
  title: string;
  note: string;
  source: "yahoo" | "profile" | "macro";
}

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
  source: PriceSource;
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
  /** Idioma detectado o preferido del proveedor. */
  languageHint?: "es" | "en" | "unknown";
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
  /** Idioma del título/resumen mostrados. */
  language?: "es" | "en";
  /** true si título/resumen fueron traducidos al español. */
  translated?: boolean;
}

export interface Recommendation {
  action: RecommendationAction;
  rationale: string;
  confidence: number; // 0–1
  factors: string[];
  levels?: RecommendationLevels;
}

export interface AnalyzeResponse {
  ticker: string;
  company: CompanyProfile;
  price: PriceAnalysis;
  news: ScoredNewsItem[];
  recommendation: Recommendation;
  catalysts: CatalystItem[];
  meta: {
    newsProvider: NewsProviderName;
    priceSource: PriceSource;
    scorer: "openai" | "heuristic";
    recommender: "openai" | "heuristic";
    generatedAt: string;
    positionAware: boolean;
  };
}

export interface BoardCard {
  ticker: string;
  companyName: string;
  boardColumn: "comprar" | "vender" | "reducir" | "mantener";
  boardLabel: string;
  sourceAction: RecommendationAction;
  rationale: string;
  confidence: number;
  price: PriceSnapshot;
  factors: string[];
  meta: AnalyzeResponse["meta"];
}

export interface BoardResponse {
  tickers: string[];
  cards: BoardCard[];
  errors: { ticker: string; error: string }[];
  meta: {
    cached: boolean;
    concurrency: number;
    generatedAt: string;
  };
}

export interface AnalyzeError {
  error: string;
  details?: string;
}
