import OpenAI from "openai";
import type {
  CompanyProfile,
  RawNewsItem,
  ScoredNewsItem,
  PriceDirection,
  NewsScope,
} from "../types";
import { getOpenAIModel } from "../openai-config";
import { scoreNewsHeuristic } from "./heuristic";

interface LlmScoreRow {
  id: string;
  score: number;
  direction: PriceDirection;
  scope: NewsScope;
  explanation: string;
  titleEs?: string;
  summaryEs?: string;
}

function buildPrompt(profile: CompanyProfile, items: RawNewsItem[]): string {
  return `Eres un analista cuantitativo de noticias bursátiles (mercado es-CO / global).
Evalúa el impacto potencial de cada noticia sobre el PRECIO de ${profile.ticker} (${profile.name}).

Contexto de la empresa:
- Sector: ${profile.sector}
- Modelo: ${profile.businessModel}
- Fortalezas: ${profile.strengths.join("; ")}
- Dependencias: ${profile.dependencies.join("; ")}
- Competidores: ${profile.competitors.join(", ")}
- Proveedores: ${profile.suppliers.join(", ")}
- Notas financieras: ${profile.financialNotes}

También puntúa noticias MACRO/sectoriales (Fed, aranceles, guerras, shocks de sector) aunque no nombren a la empresa, si pueden mover el precio.

Para cada noticia devuelve JSON array con:
{ "id", "score" (1-10 entero), "direction" ("up"|"down"|"neutral"), "scope" ("company"|"macro"), "explanation" (1-2 frases en español), "titleEs" (título en español; si ya está en español, copia el original), "summaryEs" (resumen breve en español; no inventes hechos) }

Descarta mentalmente irrelevantes (score bajo). Noticias:
${JSON.stringify(
  items.map((i) => ({
    id: i.id,
    title: i.title,
    summary: i.summary,
    tickers: i.tickers,
    isMacroHint: i.isMacroHint ?? false,
    languageHint: i.languageHint ?? "unknown",
  })),
  null,
  2
)}

Responde SOLO con JSON array válido.`;
}

export async function scoreNewsWithOpenAI(
  items: RawNewsItem[],
  profile: CompanyProfile,
  apiKey: string
): Promise<ScoredNewsItem[]> {
  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Responde con un objeto JSON {"items":[...]} donde items es el array de scores. Explicaciones, titleEs y summaryEs en español (es-CO). No inventes noticias.',
        },
        { role: "user", content: buildPrompt(profile, items) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { items?: LlmScoreRow[] } | LlmScoreRow[];
    const rows: LlmScoreRow[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.items)
        ? parsed.items
        : [];

    const byId = new Map(rows.map((r) => [r.id, r]));
    const scored: ScoredNewsItem[] = [];

    for (const item of items) {
      const row = byId.get(item.id);
      if (!row) continue;
      const score = Math.max(1, Math.min(10, Math.round(Number(row.score) || 1)));
      if (score < 5) continue;
      const titleEs = row.titleEs?.trim();
      const summaryEs = row.summaryEs?.trim();
      const translated = Boolean(
        (titleEs && titleEs !== item.title) ||
          (summaryEs && summaryEs !== item.summary)
      );
      scored.push({
        id: item.id,
        title: titleEs || item.title,
        summary: summaryEs || item.summary,
        url: item.url,
        publishedAt: item.publishedAt,
        source: item.source,
        scope: row.scope === "macro" ? "macro" : "company",
        score,
        direction:
          row.direction === "up" || row.direction === "down"
            ? row.direction
            : "neutral",
        explanation: row.explanation || "Sin explicación.",
        language: "es",
        translated,
      });
    }

    if (scored.length === 0) {
      return scoreNewsHeuristic(items, profile);
    }
    return scored.sort((a, b) => b.score - a.score);
  } catch (err) {
    console.warn("[scorer] OpenAI falló, usando heurística:", err);
    return scoreNewsHeuristic(items, profile);
  }
}
