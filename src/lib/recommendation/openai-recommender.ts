import OpenAI from "openai";
import type {
  CompanyProfile,
  PositionContext,
  PriceAnalysis,
  Recommendation,
  RecommendationAction,
  RecommendationLevels,
  ScoredNewsItem,
} from "../types";
import { getOpenAIModel } from "../openai-config";
import { hasOpenPosition } from "../position-storage";
import { recommendHeuristic } from "./heuristic";
import { deriveLevelsHeuristic, mergeLevels } from "./levels";

const ACTIONS: RecommendationAction[] = [
  "comprar",
  "aumentar",
  "mantener",
  "reducir",
  "salir",
];

function normalizeAction(raw: unknown, flat: boolean): RecommendationAction {
  const s = String(raw || "").toLowerCase().trim();
  if (s === "invertir") return flat ? "comprar" : "aumentar";
  if (s === "retirar") return flat ? "mantener" : "salir";
  if (ACTIONS.includes(s as RecommendationAction)) {
    const a = s as RecommendationAction;
    // Coherencia posición
    if (flat && a === "aumentar") return "comprar";
    if (flat && (a === "salir" || a === "reducir")) return "mantener";
    if (!flat && a === "comprar") return "aumentar";
    return a;
  }
  return flat ? "mantener" : "mantener";
}

export async function recommendWithOpenAI(
  news: ScoredNewsItem[],
  price: PriceAnalysis,
  profile: CompanyProfile,
  apiKey: string,
  position?: PositionContext
): Promise<Recommendation> {
  const flat = !hasOpenPosition(position);
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
        recentCloses: price.history.slice(-10).map((h) => h.close),
      },
      position: position ?? null,
      flat,
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
            "Eres un asesor de inversiones cauteloso. Responde en español (es-CO). No es consejo financiero regulado; es una señal educativa del MVP. Si el usuario declara posición, adapta la acción y el rationale a esa realidad (P&L, horizonte, riesgo).",
        },
        {
          role: "user",
          content: `Con el contexto, noticias (score≥5) y posición del usuario, recomienda UNA acción:
- comprar (solo si flat / sin posición)
- aumentar (si ya hay posición y sesgo alcista)
- mantener
- reducir
- salir (si hay posición y sesgo bajista fuerte)

Incluye rationale (2-3 frases, menciona la posición si existe), confidence 0-1, factors (array), y levels coherentes con acción + horizonte:
{"zonaEntrada":"min–max o null","precioEntrada":number|null,"stopSugerido":number|null,"objetivo":number|null,"invalidacion":"texto"}

Datos:
${JSON.stringify(payload, null, 2)}

JSON: {"action","rationale","confidence","factors","levels"}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<Recommendation> & {
      levels?: Partial<RecommendationLevels>;
    };
    const action = normalizeAction(parsed.action, flat);
    const confidence = Math.max(
      0,
      Math.min(1, Number(parsed.confidence) || 0.5)
    );

    const fallbackLevels = deriveLevelsHeuristic(
      price,
      action,
      position?.riskTolerance
    );
    const levels = mergeLevels(parsed.levels, fallbackLevels);

    return {
      action,
      rationale:
        parsed.rationale ||
        "Recomendación generada por modelo con señales mixtas.",
      confidence: Number(confidence.toFixed(2)),
      factors: Array.isArray(parsed.factors)
        ? parsed.factors.map(String).slice(0, 8)
        : [],
      levels,
    };
  } catch (err) {
    console.warn("[recommender] OpenAI falló, usando heurística:", err);
    return recommendHeuristic(news, price, position);
  }
}
