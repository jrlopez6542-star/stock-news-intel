import type {
  CompanyProfile,
  PriceDirection,
  RawNewsItem,
  ScoredNewsItem,
} from "../types";

const BULLISH = [
  "eleva",
  "sube",
  "crecimiento",
  "supera",
  "récord",
  "record",
  "beat",
  "alivio",
  "demanda",
  "aceler",
  "upgrade",
  "buy",
  "fuerte",
  "mejora",
  "optimismo",
  "rally",
  "capex",
  "inversión",
  "partnership",
  "lanza",
  "aprob",
];

const BEARISH = [
  "multa",
  "investigación",
  "probe",
  "caída",
  "cae",
  "recorte",
  "riesgo",
  "retraso",
  "retrasa",
  "guerra",
  "arancel",
  "tariff",
  "restricción",
  "export",
  "demanda débil",
  "downgrade",
  "sell",
  "presión",
  "costos",
  "encarece",
  "volatilidad",
  "tensión",
];

const MACRO_KEYS = [
  "fed",
  "tasa",
  "rates",
  "arancel",
  "tariff",
  "guerra",
  "geopolít",
  "inflación",
  "oil",
  "petróleo",
  "sector",
  "macro",
  "cio",
  "gasto ti",
];

function countHits(text: string, words: string[]): number {
  const t = text.toLowerCase();
  return words.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
}

function detectScope(
  item: RawNewsItem,
  profile: CompanyProfile
): "company" | "macro" {
  if (item.isMacroHint) return "macro";
  const text = `${item.title} ${item.summary}`.toLowerCase();
  const mentionsCompany =
    item.tickers.map((t) => t.toUpperCase()).includes(profile.ticker) ||
    profile.keywords.some((k) => text.includes(k.toLowerCase())) ||
    text.includes(profile.name.toLowerCase().split(" ")[0]!);
  if (!mentionsCompany && countHits(text, MACRO_KEYS) > 0) return "macro";
  if (!mentionsCompany) return "macro";
  return "company";
}

function baseScore(item: RawNewsItem, profile: CompanyProfile): {
  score: number;
  direction: PriceDirection;
  explanation: string;
} {
  const text = `${item.title} ${item.summary}`;
  const bull = countHits(text, BULLISH);
  const bear = countHits(text, BEARISH);
  const kw = countHits(text.toLowerCase(), profile.keywords.map((k) => k.toLowerCase()));
  const dep = countHits(
    text.toLowerCase(),
    profile.dependencies.map((d) => d.toLowerCase().slice(0, 12))
  );

  let score = 4 + kw + Math.min(dep, 2);
  let direction: PriceDirection = "neutral";

  if (bull > bear) {
    score += 2 + Math.min(bull, 2);
    direction = "up";
  } else if (bear > bull) {
    score += 2 + Math.min(bear, 2);
    direction = "down";
  } else if (bull === bear && bull > 0) {
    score += 1;
    direction = "neutral";
  }

  // Low-impact cosmetic headlines
  if (
    /fondo de pantalla|wallpaper|merchandising|branding|patrocina|universitaria/i.test(
      text
    )
  ) {
    score = Math.min(score, 3);
    direction = "neutral";
  }

  score = Math.max(1, Math.min(10, Math.round(score)));

  const explanation =
    direction === "up"
      ? `Señales positivas (${bull}) alineadas con el modelo de ${profile.ticker}; relevancia contextual ${kw + dep}.`
      : direction === "down"
        ? `Señales de riesgo (${bear}) sobre dependencias o regulación de ${profile.ticker}.`
        : `Impacto mixto o cosmético; score heurístico ${score}/10.`;

  return { score, direction, explanation };
}

/** Scoreador demo: filtra <5 y etiqueta company vs macro. */
export function scoreNewsHeuristic(
  items: RawNewsItem[],
  profile: CompanyProfile
): ScoredNewsItem[] {
  return items
    .map((item) => {
      const scope = detectScope(item, profile);
      const { score, direction, explanation } = baseScore(item, profile);

      // Macro news that can move the stock gets a small boost if relevant
      let finalScore = score;
      if (scope === "macro") {
        const text = `${item.title} ${item.summary}`.toLowerCase();
        const relevantMacro =
          countHits(text, MACRO_KEYS) > 0 ||
          profile.dependencies.some((d) =>
            text.includes(d.toLowerCase().slice(0, 8))
          ) ||
          profile.sector.toLowerCase().split(/[\s/]+/).some((s) => s.length > 3 && text.includes(s));
        if (relevantMacro) finalScore = Math.min(10, finalScore + 1);
        else finalScore = Math.min(finalScore, 4);
      }

      return {
        id: item.id,
        title: item.title,
        summary: item.summary,
        url: item.url,
        publishedAt: item.publishedAt,
        source: item.source,
        scope,
        score: finalScore,
        direction,
        explanation:
          scope === "macro"
            ? `[Macro/sector] ${explanation}`
            : explanation,
      } satisfies ScoredNewsItem;
    })
    .filter((n) => n.score >= 5)
    .sort((a, b) => b.score - a.score);
}
