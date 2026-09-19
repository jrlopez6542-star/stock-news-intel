import type { HorizonUnit, PositionContext, RiskTolerance } from "./types";

const PREFIX = "sni:position:";

const HORIZON_UNITS: HorizonUnit[] = ["dias", "meses", "anos"];
const RISKS: RiskTolerance[] = ["conservador", "moderado", "agresivo"];

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Normaliza y limpia un PositionContext desde JSON / formulario. */
export function sanitizePositionContext(
  raw: unknown
): PositionContext | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const sharesHeld = numOrNull(o.sharesHeld);
  const avgEntryPrice = numOrNull(o.avgEntryPrice);
  const portfolioPct = numOrNull(o.portfolioPct);
  const horizonValue = numOrNull(o.horizonValue);
  const horizonUnit =
    typeof o.horizonUnit === "string" &&
    HORIZON_UNITS.includes(o.horizonUnit as HorizonUnit)
      ? (o.horizonUnit as HorizonUnit)
      : null;
  const riskTolerance =
    typeof o.riskTolerance === "string" &&
    RISKS.includes(o.riskTolerance as RiskTolerance)
      ? (o.riskTolerance as RiskTolerance)
      : null;

  const ctx: PositionContext = {
    sharesHeld,
    avgEntryPrice,
    portfolioPct,
    horizonValue,
    horizonUnit,
    riskTolerance,
  };

  const hasAny =
    sharesHeld != null ||
    avgEntryPrice != null ||
    portfolioPct != null ||
    (horizonValue != null && horizonUnit != null) ||
    riskTolerance != null;

  return hasAny ? ctx : undefined;
}

export function hasOpenPosition(ctx?: PositionContext | null): boolean {
  if (!ctx) return false;
  return (ctx.sharesHeld != null && ctx.sharesHeld > 0) || false;
}

export function loadPosition(ticker: string): PositionContext {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PREFIX + ticker.toUpperCase());
    if (!raw) return {};
    return sanitizePositionContext(JSON.parse(raw)) ?? {};
  } catch {
    return {};
  }
}

export function savePosition(ticker: string, ctx: PositionContext): void {
  if (typeof window === "undefined") return;
  try {
    const clean = sanitizePositionContext(ctx);
    const key = PREFIX + ticker.toUpperCase();
    if (!clean) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(clean));
  } catch {
    /* quota / private mode */
  }
}

export function formatPositionSummary(ctx?: PositionContext | null): string {
  if (!ctx) return "Sin posición declarada";
  const parts: string[] = [];
  if (ctx.sharesHeld != null && ctx.sharesHeld > 0) {
    parts.push(`${ctx.sharesHeld} acciones`);
  }
  if (ctx.avgEntryPrice != null) {
    parts.push(`entrada media ${ctx.avgEntryPrice}`);
  }
  if (ctx.portfolioPct != null) {
    parts.push(`${ctx.portfolioPct}% portafolio`);
  }
  if (ctx.horizonValue != null && ctx.horizonUnit) {
    parts.push(`horizonte ${ctx.horizonValue} ${ctx.horizonUnit}`);
  }
  if (ctx.riskTolerance) {
    parts.push(`riesgo ${ctx.riskTolerance}`);
  }
  return parts.length ? parts.join(" · ") : "Sin posición declarada";
}
