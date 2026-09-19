import OpenAI from "openai";
import type {
  CompanyProfile,
  PriceAnalysis,
  Recommendation,
  RecommendationAction,
  ScoredNewsItem,
} from "../types";
import { getOpenAIModel } from "../openai-config";
import { recommendHeuristic } from "./heuristic";

const ACTIONS: RecommendationAction[] = [
  "invertir",
  "mantener",
  "reducir",
  "retirar",
];

export async function recommendWithOpenAI(
  news: ScoredNewsItem[],
  price: PriceAnalysis,
  profile: CompanyProfile,
  apiKey: string
): Promise<Recommendation> {
  try {
    const client = new OpenAI({ apiKey });
    const payload = {
      ticker: profile.ticker,
      company: {
        name: profile.name,
        sector: profile.sector,
        businessModel: profile.businessModel,
        strengths: profile.strengths,
        dependencies: profile.dependencies,
      },
      price: {
        last: price.snapshot.price,
        changePct: price.snapshot.changePct,
        streak7: price.streak7,
        streak30: price.streak30,
      },
      news: news.map((n) => ({
        title: n.title,
        score: n.score,
        direction: n.direction,
        scope: n.scope,
        explanation: n.explanation,
      })),
    };

    const completion = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un asesor de inversiones cauteloso. Responde en español (es-CO). No es consejo financiero regulado; es una señal educativa del MVP.",
        },
        {
          role: "user",
          content: `Con el contexto y noticias ya puntuadas (solo score≥5), recomienda UNA acción: invertir | mantener | reducir | retirar.
Incluye rationale corto (2-3 frases), confidence 0-1, y factors (array de strings).
Datos:\n${JSON.stringify(payload, null, 2)}\n
JSON: {"action","rationale","confidence","factors"}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<Recommendation>;
    const action = ACTIONS.includes(parsed.action as RecommendationAction)
      ? (parsed.action as RecommendationAction)
      : "mantener";
    const confidence = Math.max(
      0,
      Math.min(1, Number(parsed.confidence) || 0.5)
    );

    return {
      action,
      rationale:
        parsed.rationale ||
        "Recomendación generada por modelo con señales mixtas.",
      confidence: Number(confidence.toFixed(2)),
      factors: Array.isArray(parsed.factors)
        ? parsed.factors.map(String).slice(0, 8)
        : [],
    };
  } catch (err) {
    console.warn("[recommender] OpenAI falló, usando heurística:", err);
    return recommendHeuristic(news, price);
  }
}
