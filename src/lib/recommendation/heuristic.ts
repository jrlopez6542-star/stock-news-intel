import type {
  PositionContext,
  PriceAnalysis,
  Recommendation,
  RecommendationAction,
  ScoredNewsItem,
} from "../types";
import { hasOpenPosition } from "../position-storage";
import { deriveLevelsHeuristic } from "./levels";

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
    const dir = n.direction === "up" ? 1 : n.direction === "down" ? -1 : 0;
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

function positionPnLFactor(
  price: PriceAnalysis,
  position?: PositionContext
): { bias: number; note: string | null } {
  if (
    !position ||
    position.avgEntryPrice == null ||
    position.avgEntryPrice <= 0 ||
    !hasOpenPosition(position)
  ) {
    return { bias: 0, note: null };
  }
  const px = price.snapshot.price;
  const pnlPct =
    ((px - position.avgEntryPrice) / position.avgEntryPrice) * 100;
  const note = `P&L latente ≈ ${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}% vs entrada ${position.avgEntryPrice}`;
  // Ganancia grande + sesgo bajista → favorecer reducir/salir un poco
  if (pnlPct > 25) return { bias: -0.15, note };
  if (pnlPct < -20) return { bias: -0.1, note }; // underwater: cautela
  return { bias: 0, note };
}

function riskAdjust(
  composite: number,
  position?: PositionContext
): number {
  const risk = position?.riskTolerance;
  if (risk === "conservador") return composite * 0.85;
  if (risk === "agresivo") return composite * 1.1;
  return composite;
}

function mapAction(
  composite: number,
  flat: boolean
): { action: RecommendationAction; confidence: number; rationale: string } {
  if (composite >= 1.2) {
    return {
      action: flat ? "comprar" : "aumentar",
      confidence: Math.min(0.92, 0.55 + composite * 0.12),
      rationale: flat
        ? "Sesgo alcista en noticias de alto impacto y rachas favorables. Sin posición declarada: considerar apertura con gestión de riesgo."
        : "Sesgo alcista con posición abierta: el contexto favorece aumentar de forma gradual, respetando horizonte y tolerancia al riesgo.",
    };
  }
  if (composite >= 0.25) {
    return {
      action: flat ? "comprar" : "mantener",
      confidence: Math.min(0.85, 0.5 + Math.abs(composite) * 0.15),
      rationale: flat
        ? "Señales moderadamente positivas sin catalizador extremo. Posible entrada táctica si encaja con el horizonte; no hay urgencia."
        : "Señales mixtas o moderadamente positivas. Con posición abierta conviene mantener y vigilar próximos catalizadores.",
    };
  }
  if (composite >= -1.0) {
    return {
      action: flat ? "mantener" : "reducir",
      confidence: Math.min(0.85, 0.5 + Math.abs(composite) * 0.12),
      rationale: flat
        ? "Predominan riesgos sin posición abierta: mejor esperar asimetría más clara antes de comprar."
        : "Riesgos (regulación, macro o dependencias) con posición abierta: conviene reducir exposición y esperar mejor punto.",
    };
  }
  return {
    action: flat ? "mantener" : "salir",
    confidence: Math.min(0.9, 0.55 + Math.abs(composite) * 0.1),
    rationale: flat
      ? "Sesgo bajista marcado. Sin posición: evitar apertura hasta que mejoren noticias y precio."
      : "Noticias bajistas de alto impacto y/o racha negativa. Con posición abierta el sesgo favorece salir o cubrir.",
  };
}

export function recommendHeuristic(
  news: ScoredNewsItem[],
  price: PriceAnalysis,
  position?: PositionContext
): Recommendation {
  const nb = newsBias(news);
  const sb = streakBias(price);
  const change = price.snapshot.changePct ?? 0;
  const pnl = positionPnLFactor(price, position);
  let composite =
    nb.score * 0.7 + sb * 0.2 + (change / 5) * 0.1 + pnl.bias;
  composite = riskAdjust(composite, position);

  const flat = !hasOpenPosition(position);
  const mapped = mapAction(composite, flat);

  const factors = [...nb.factors];
  factors.push(
    `Racha 7d: ${price.streak7.direction} ×${price.streak7.length}`,
    `Racha 30d: ${price.streak30.direction} ×${price.streak30.length}`,
    `Cambio diario: ${change.toFixed(2)}%`
  );
  if (pnl.note) factors.push(pnl.note);
  if (position?.horizonValue != null && position.horizonUnit) {
    factors.push(
      `Horizonte declarado: ${position.horizonValue} ${position.horizonUnit}`
    );
  }
  if (position?.riskTolerance) {
    factors.push(`Tolerancia al riesgo: ${position.riskTolerance}`);
  }
  if (position?.portfolioPct != null) {
    factors.push(`Peso en portafolio: ${position.portfolioPct}%`);
  }
  if (flat) {
    factors.push("Posición: flat (sin acciones declaradas)");
  } else if (position?.sharesHeld != null) {
    factors.push(`Posición: ${position.sharesHeld} acciones`);
  }

  let rationale = mapped.rationale;
  if (!flat && position?.avgEntryPrice != null) {
    rationale += ` Referencia: entrada media ${position.avgEntryPrice} vs precio ${price.snapshot.price}.`;
  }

  const levels = deriveLevelsHeuristic(
    price,
    mapped.action,
    position?.riskTolerance
  );

  return {
    action: mapped.action,
    rationale,
    confidence: Number(mapped.confidence.toFixed(2)),
    factors,
    levels,
  };
}
