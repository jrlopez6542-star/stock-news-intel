import { NextResponse } from "next/server";
import {
  getOpenAIModel,
  hasBenzingaKey,
  hasOpenAIKey,
} from "@/lib/openai-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Estado de proveedores configurados (sin filtrar secrets).
 */
export async function GET() {
  const openaiConfigured = hasOpenAIKey();
  const benzingaConfigured = hasBenzingaKey();

  return NextResponse.json({
    ok: true,
    providers: {
      price: {
        active: "yahoo",
        fallback: "demo",
        note: "Yahoo Finance (chart API + retry/backoff). Demo solo si Yahoo falla.",
      },
      news: {
        active: benzingaConfigured ? "benzinga" : "yahoo",
        configured: true,
        preferred: benzingaConfigured ? "benzinga" : "yahoo",
        note: benzingaConfigured
          ? "Benzinga preferido; Yahoo RSS/search como respaldo gratis"
          : "Yahoo Finance RSS/search (gratis, sin key). Mock solo si falla.",
      },
      scoring: {
        active: openaiConfigured ? "openai" : "heuristic",
        configured: openaiConfigured,
        model: openaiConfigured ? getOpenAIModel() : null,
        note: openaiConfigured
          ? `OpenAI (${getOpenAIModel()})`
          : "Heurística — pega OPENAI_API_KEY en .env.local para IA",
      },
      recommendation: {
        active: openaiConfigured ? "openai" : "heuristic",
        configured: openaiConfigured,
        model: openaiConfigured ? getOpenAIModel() : null,
      },
    },
    generatedAt: new Date().toISOString(),
  });
}
