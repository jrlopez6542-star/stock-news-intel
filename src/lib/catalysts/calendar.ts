import yahooFinance from "yahoo-finance2";
import type { CatalystItem, CompanyProfile } from "../types";

try {
  yahooFinance.suppressNotices(["yahooSurvey", "ripHistorical"]);
} catch {
  /* ignore */
}

const YAHOO_UA =
  "Mozilla/5.0 (compatible; StockNewsIntel/1.0; +https://stock-news-intel.vercel.app)";

function isoDate(d: Date | string | number | null | undefined): string | null {
  if (d == null) return null;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

function daysFromToday(iso: string): number {
  const t = new Date(iso + "T12:00:00Z").getTime();
  const now = Date.now();
  return Math.round((t - now) / (24 * 60 * 60 * 1000));
}

/** Macro placeholders relevantes según sector / dependencias. */
function macroPlaceholders(profile: CompanyProfile): CatalystItem[] {
  const year = new Date().getFullYear();
  const sector = (
    profile.sector +
    " " +
    profile.dependencies.join(" ")
  ).toLowerCase();
  const items: CatalystItem[] = [];

  const rateSensitive =
    /tecnolog|software|consumo|auto|inmuebl|reit|banco|financ/i.test(sector) ||
    profile.dependencies.some((d) => /fed|tasas|inflaci/i.test(d));

  if (rateSensitive) {
    items.push({
      date: `${year}-11-05`,
      type: "macro",
      title: "Decisión de tasas Fed (FOMC)",
      note: "Placeholder educativo: vigilar comunicados de la Fed y curva de tasas; impacto típico en múltiplos de crecimiento.",
      source: "macro",
    });
    items.push({
      date: `${year}-10-10`,
      type: "macro",
      title: "IPC / inflación EE.UU. (aprox.)",
      note: "Dato macro de referencia; puede mover el costo de capital y el apetito por riesgo sectorial.",
      source: "macro",
    });
  }

  if (
    /semi|gpu|ia|chip|nvidia|tsmc/i.test(
      sector + " " + profile.keywords.join(" ")
    )
  ) {
    items.push({
      date: `${year}-10-15`,
      type: "macro",
      title: "Ciclo CapEx hyperscalers / export controls",
      note: "Catalizador sectorial: revisiones de CapEx de nube y restricciones de exportación pueden mover el narrative de semis.",
      source: "macro",
    });
  }

  if (/auto|ev|energ/i.test(sector)) {
    items.push({
      date: `${year}-12-01`,
      type: "macro",
      title: "Demanda EV / materias primas",
      note: "Seguir precios de litio y guerra de precios EV; afectan márgenes y entregas.",
      source: "macro",
    });
  }

  return items.slice(0, 3);
}

function fromProfileNotes(profile: CompanyProfile): CatalystItem[] {
  if (!profile.financialNotes?.trim()) return [];
  return [
    {
      date: new Date().toISOString().slice(0, 10),
      type: "company",
      title: "Notas del perfil de empresa",
      note: profile.financialNotes.slice(0, 280),
      source: "profile",
    },
  ];
}

interface CalendarEventsShape {
  earnings?: {
    earningsDate?: Array<Date | number | string | { raw?: number }>;
    earningsAverage?: number | null;
    earningsLow?: number | null;
    earningsHigh?: number | null;
    revenueAverage?: number | null;
  };
  exDividendDate?: Date | number | string | null;
  dividendDate?: Date | number | string | null;
}

function pickDate(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "object" && v !== null && "raw" in v) {
    const raw = (v as { raw?: number }).raw;
    if (typeof raw === "number") return isoDate(raw * 1000);
  }
  return isoDate(v as Date | string | number);
}

function mapCalendar(cal: CalendarEventsShape): CatalystItem[] {
  const out: CatalystItem[] = [];
  const dates = cal.earnings?.earningsDate ?? [];
  for (const d of dates.slice(0, 2)) {
    const iso = pickDate(d);
    if (!iso) continue;
    const delta = daysFromToday(iso);
    const when =
      delta === 0
        ? "hoy"
        : delta > 0
          ? `en ${delta} día(s)`
          : `hace ${Math.abs(delta)} día(s)`;
    const epsBits: string[] = [];
    if (cal.earnings?.earningsAverage != null) {
      epsBits.push(`EPS consenso ≈ ${cal.earnings.earningsAverage}`);
    }
    if (
      cal.earnings?.earningsLow != null &&
      cal.earnings?.earningsHigh != null
    ) {
      epsBits.push(
        `rango ${cal.earnings.earningsLow}–${cal.earnings.earningsHigh}`
      );
    }
    out.push({
      date: iso,
      type: "earnings",
      title: `Resultados trimestrales (${when})`,
      note:
        epsBits.length > 0
          ? epsBits.join(" · ")
          : "Fecha de earnings según Yahoo Finance (calendario).",
      source: "yahoo",
    });
  }

  const exDiv = pickDate(cal.exDividendDate ?? null);
  if (exDiv) {
    out.push({
      date: exDiv,
      type: "other",
      title: "Ex-dividendo",
      note: "Fecha ex-dividendo reportada por Yahoo (si aplica).",
      source: "yahoo",
    });
  }
  return out;
}

async function fetchEarningsViaRest(symbol: string): Promise<CatalystItem[]> {
  const hosts = [
    "https://query1.finance.yahoo.com",
    "https://query2.finance.yahoo.com",
  ];
  for (const host of hosts) {
    try {
      const url = `${host}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=calendarEvents`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": YAHOO_UA },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        quoteSummary?: {
          result?: Array<{ calendarEvents?: CalendarEventsShape }>;
        };
      };
      const cal = data.quoteSummary?.result?.[0]?.calendarEvents;
      if (!cal) continue;
      return mapCalendar(cal);
    } catch {
      /* try next */
    }
  }
  return [];
}

async function fetchEarningsViaSdk(symbol: string): Promise<CatalystItem[]> {
  try {
    const r = await yahooFinance.quoteSummary(symbol, {
      modules: ["calendarEvents"],
    });
    const cal = (r as { calendarEvents?: CalendarEventsShape }).calendarEvents;
    if (!cal) return [];
    return mapCalendar(cal);
  } catch {
    return [];
  }
}

/**
 * Catalizadores próximos/recientes: earnings (Yahoo) + macro placeholders + notas de perfil.
 * Degrada con estado vacío claro si Yahoo falla.
 */
export async function fetchCatalysts(
  ticker: string,
  profile: CompanyProfile
): Promise<{ items: CatalystItem[]; earningsOk: boolean }> {
  const symbol = ticker.trim().toUpperCase();
  let earnings: CatalystItem[] = [];
  let earningsOk = false;

  try {
    earnings = await fetchEarningsViaRest(symbol);
    if (earnings.length === 0) {
      earnings = await fetchEarningsViaSdk(symbol);
    }
    earningsOk = earnings.some((e) => e.type === "earnings");
  } catch {
    earnings = [];
    earningsOk = false;
  }

  const macro = macroPlaceholders(profile);
  const profileNotes = earningsOk ? [] : fromProfileNotes(profile);

  const merged = [...earnings, ...macro, ...profileNotes];
  merged.sort((a, b) => a.date.localeCompare(b.date));

  return { items: merged.slice(0, 8), earningsOk };
}
