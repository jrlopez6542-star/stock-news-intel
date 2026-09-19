import type {
  PriceAnalysis,
  Recommendation,
  RecommendationAction,
  ScoredNewsItem,
} from "../types";

function streakBias(pa: PriceAnalysis): number {
  let s = 0;
  if (pa.streak7.direction === "up") s += pa.streak7.length * 0.15;
  if (pa.streak7.direction === "down") s -= pa.streak7.length * 0.15;
  if (pa.streak30.direction === "up") s += pa.streak30.length * 0.05;
  if (pa.streak30.direction === "down") s -= pa.streak30.length * 0.05;
  return s;
}

function newsBias(news: ScoredNewsItem[]): {
  score: number;
  factors: string[];
} {
  if (news.length === 0) {
    return { score: 0, factors: ["Sin noticias relevantes (score ≥5)"] };
  }
  let weighted = 0;
  let weight = 0;
  const factors: string[] = [];
  for (const n of news) {
    const dir =
      n.direction === "up" ? 1 : n.direction === "down" ? -1 : 0;
    const w = n.score;
    weighted += dir * w;
    weight += w;
    if (factors.length < 4) {
      factors.push(
        `${n.scope === "macro" ? "Macro" : "Empresa"} ${n.score}/10 (${n.direction}): ${n.title.slice(0, 80)}`
      );
    }
  }
  return { score: weight ? weighted / weight : 0, factors };
}

export function recommendHeuristic(
  news: ScoredNewsItem[],
  price: PriceAnalysis
): Recommendation {
  const nb = newsBias(news);
  const sb = streakBias(price);
  const change = price.snapshot.changePct ?? 0;
  const composite = nb.score * 0.7 + sb * 0.2 + (change / 5) * 0.1;

  let action: RecommendationAction;
  let confidence: number;
  let rationale: string;

  if (composite >= 1.2) {
    action = "invertir";
    confidence = Math.min(0.92, 0.55 + composite * 0.12);
    rationale =
      "Sesgo alcista en noticias de alto impacto y rachas recientes favorables. Considerar entrada o ampliar posición con gestión de riesgo.";
  } else if (composite >= 0.25) {
    action = "mantener";
    confidence = Math.min(0.85, 0.5 + Math.abs(composite) * 0.15);
    rationale =
      "Señales mixtas o moderadamente positivas. No hay catalizador claro para rotar; mantener y vigilar próximos datos.";
  } else if (composite >= -1.0) {
    action = "reducir";
    confidence = Math.min(0.85, 0.5 + Math.abs(composite) * 0.12);
    rationale =
      "Predominan riesgos (regulación, macro o dependencias). Conviene reducir exposición y esperar mejor asimetría.";
  } else {
    action = "retirar";
    confidence = Math.min(0.9, 0.55 + Math.abs(composite) * 0.1);
    rationale =
      "Noticias de alto impacto bajistas y/o racha negativa persistente. El sesgo favorece salir o cubrir la posición.";
  }

  const factors = [
    ...nb.factors,
    `Racha 7d: ${price.streak7.direction} ×${price.streak7.length}`,
    `Racha 30d: ${price.streak30.direction} ×${price.streak30.length}`,
    `Cambio diario: ${change.toFixed(2)}%`,
  ];

  return {
    action,
    rationale,
    confidence: Number(confidence.toFixed(2)),
    factors,
  };
}
