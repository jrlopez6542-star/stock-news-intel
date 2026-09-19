import OpenAI from "openai";
import type { ScoredNewsItem } from "../types";
import { getOpenAIModel } from "../openai-config";
import { looksLikeEnglish, looksLikeSpanish } from "./language";

interface TranslatedRow {
  id: string;
  title: string;
  summary: string;
}

/**
 * Traduce en lote título + resumen al español cuando el texto parece inglés.
 * No inventa noticias: solo traduce el contenido existente.
 */
export async function ensureNewsInSpanish(
  items: ScoredNewsItem[],
  apiKey: string
): Promise<ScoredNewsItem[]> {
  if (items.length === 0) return items;

  const needTranslate = items.filter(
    (i) =>
      looksLikeEnglish(`${i.title} ${i.summary}`) &&
      !looksLikeSpanish(`${i.title} ${i.summary}`)
  );

  if (needTranslate.length === 0) {
    return items.map((i) => ({
      ...i,
      language: looksLikeSpanish(`${i.title} ${i.summary}`) ? "es" : "en",
      translated: false,
    }));
  }

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Traduce al español (es-CO) títulos y resúmenes de noticias bursátiles. No inventes hechos. Responde JSON {"items":[{"id","title","summary"}]}.',
        },
        {
          role: "user",
          content: `Traduce title y summary al español. Mantén el mismo id. No agregues opiniones.\n${JSON.stringify(
            needTranslate.map((i) => ({
              id: i.id,
              title: i.title,
              summary: i.summary.slice(0, 500),
            })),
            null,
            2
          )}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { items?: TranslatedRow[] };
    const rows = Array.isArray(parsed.items) ? parsed.items : [];
    const byId = new Map(rows.map((r) => [r.id, r]));

    return items.map((item) => {
      const row = byId.get(item.id);
      if (!row?.title) {
        return {
          ...item,
          language: looksLikeSpanish(`${item.title} ${item.summary}`)
            ? ("es" as const)
            : ("en" as const),
          translated: false,
        };
      }
      return {
        ...item,
        title: String(row.title).trim() || item.title,
        summary: String(row.summary || item.summary).trim() || item.summary,
        language: "es" as const,
        translated: true,
      };
    });
  } catch (err) {
    console.warn("[translate-es] OpenAI falló:", err);
    return items.map((i) => ({
      ...i,
      language: looksLikeSpanish(`${i.title} ${i.summary}`) ? "es" : "en",
      translated: false,
    }));
  }
}

/** Sin OpenAI: deja original; etiqueta ligera si parece inglés. */
export function labelNewsLanguage(items: ScoredNewsItem[]): ScoredNewsItem[] {
  return items.map((i) => {
    const es = looksLikeSpanish(`${i.title} ${i.summary}`);
    return {
      ...i,
      language: es ? ("es" as const) : ("en" as const),
      translated: false,
      // explanations already Spanish from heuristic; titles may stay EN
    };
  });
}
