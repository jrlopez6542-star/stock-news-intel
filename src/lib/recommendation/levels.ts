import type {
  DailyBar,
  PriceAnalysis,
  RecommendationAction,
  RecommendationLevels,
  RiskTolerance,
} from "../types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** ATR aproximado a partir de cierres (rango true-range simplificado). */
export function approxAtr(history: DailyBar[], period = 14): number {
  if (history.length < 3) {
    const last = history[history.length - 1]?.close ?? 0;
    return last * 0.02;
  }
  const slice = history.slice(-Math.max(period + 1, 5));
  const ranges: number[] = [];
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1]!.close;
    const cur = slice[i]!.close;
    ranges.push(Math.abs(cur - prev));
  }
  const avg =
    ranges.reduce((a, b) => a + b, 0) / Math.max(ranges.length, 1);
  return avg > 0 ? avg : (slice[slice.length - 1]!.close || 1) * 0.02;
}

function recentHighLow(history: DailyBar[], lookback = 20): {
  high: number;
  low: number;
} {
  const slice = history.slice(-lookback);
  if (slice.length === 0) return { high: 0, low: 0 };
  let high = -Infinity;
  let low = Infinity;
  for (const b of slice) {
    if (b.close > high) high = b.close;
    if (b.close < low) low = b.close;
  }
  return { high, low };
}

function riskMult(risk?: RiskTolerance | null): {
  stop: number;
  target: number;
} {
  switch (risk) {
    case "conservador":
      return { stop: 1.0, target: 1.5 };
    case "agresivo":
      return { stop: 2.0, target: 3.5 };
    case "moderado":
    default:
      return { stop: 1.5, target: 2.5 };
  }
}

function normalizeAction(action: RecommendationAction): RecommendationAction {
  if (action === "invertir") return "comprar";
  if (action === "retirar") return "salir";
  return action;
}

/**
 * Niveles heurísticos coherentes con la acción y el horizonte de riesgo.
 */
export function deriveLevelsHeuristic(
  price: PriceAnalysis,
  action: RecommendationAction,
  riskTolerance?: RiskTolerance | null
): RecommendationLevels {
  const px = price.snapshot.price;
  const atr = approxAtr(price.history);
  const { high, low } = recentHighLow(price.history, 20);
  const m = riskMult(riskTolerance);
  const act = normalizeAction(action);

  if (act === "comprar" || act === "aumentar") {
    const entryLow = round2(Math.max(low, px - atr * 0.6));
    const entryHigh = round2(px + atr * 0.25);
    const stop = round2(Math.min(px - atr * m.stop, low - atr * 0.2));
    const target = round2(Math.max(px + atr * m.target, high));
    return {
      zonaEntrada: `${entryLow}–${entryHigh}`,
      precioEntrada: round2(px),
      stopSugerido: stop,
      objetivo: target,
      invalidacion: `Cierre sostenido bajo ${stop} o noticia adversa de alto impacto (regulación / resultados).`,
    };
  }

  if (act === "mantener") {
    const stop = round2(px - atr * m.stop);
    const target = round2(px + atr * m.target * 0.8);
    return {
      zonaEntrada: null,
      precioEntrada: null,
      stopSugerido: stop,
      objetivo: target,
      invalidacion: `Ruptura de ${stop} o deterioro claro del sesgo de noticias (score bajista persistente).`,
    };
  }

  if (act === "reducir") {
    const stop = round2(px - atr * (m.stop * 0.8));
    const target = round2(Math.max(low, px - atr * m.target * 0.6));
    return {
      zonaEntrada: null,
      precioEntrada: null,
      stopSugerido: stop,
      objetivo: target,
      invalidacion: `Rebote fuerte sobre ${round2(high)} con noticias claramente positivas podría invalidar la reducción.`,
    };
  }

  // salir
  const stop = round2(px + atr * 0.8);
  return {
    zonaEntrada: null,
    precioEntrada: null,
    stopSugerido: stop,
    objetivo: round2(Math.min(px - atr * m.target * 0.5, low)),
    invalidacion: `Recuperación por encima de ${stop} con catalizador positivo de alto score invalidaría la salida inmediata.`,
  };
}

export function mergeLevels(
  partial: Partial<RecommendationLevels> | null | undefined,
  fallback: RecommendationLevels
): RecommendationLevels {
  if (!partial) return fallback;
  return {
    zonaEntrada:
      partial.zonaEntrada !== undefined
        ? partial.zonaEntrada
        : fallback.zonaEntrada,
    precioEntrada:
      partial.precioEntrada != null && Number.isFinite(partial.precioEntrada)
        ? Number(partial.precioEntrada)
        : fallback.precioEntrada,
    stopSugerido:
      partial.stopSugerido != null && Number.isFinite(partial.stopSugerido)
        ? Number(partial.stopSugerido)
        : fallback.stopSugerido,
    objetivo:
      partial.objetivo != null && Number.isFinite(partial.objetivo)
        ? Number(partial.objetivo)
        : fallback.objetivo,
    invalidacion:
      typeof partial.invalidacion === "string" && partial.invalidacion.trim()
        ? partial.invalidacion.trim()
        : fallback.invalidacion,
  };
}
