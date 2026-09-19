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
 * Útil para ver en UI o curl si hay keys sin abrir .env.local.
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
        note: "Yahoo Finance gratis, sin key",
      },
      news: {
        active: benzingaConfigured ? "benzinga" : "mock",
        configured: benzingaConfigured,
        note: benzingaConfigured
          ? "Benzinga Basic (headline/teaser)"
          : "Mock demo — pega BENZINGA_API_KEY en .env.local",
      },
      scoring: {
        active: openaiConfigured ? "openai" : "heuristic",
        configured: openaiConfigured,
        model: openaiConfigured ? getOpenAIModel() : null,
        note: openaiConfigured
          ? `OpenAI (${getOpenAIModel()})`
          : "Heurística demo — pega OPENAI_API_KEY en .env.local",
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
