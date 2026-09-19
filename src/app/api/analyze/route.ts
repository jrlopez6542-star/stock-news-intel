import { NextRequest, NextResponse } from "next/server";
import { analyzeTicker } from "@/lib/analyze-ticker";
import { sanitizePositionContext } from "@/lib/position-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TICKER_RE = /^[A-Za-z.]{1,10}$/;

function parsePositionFromQuery(sp: URLSearchParams) {
  const raw: Record<string, string> = {};
  for (const key of [
    "sharesHeld",
    "avgEntryPrice",
    "portfolioPct",
    "horizonValue",
    "horizonUnit",
    "riskTolerance",
  ]) {
    const v = sp.get(key);
    if (v != null && v !== "") raw[key] = v;
  }
  return sanitizePositionContext(raw);
}

async function runAnalyze(tickerParam: string, position: unknown) {
  if (!tickerParam || !TICKER_RE.test(tickerParam)) {
    return NextResponse.json(
      {
        error: "Ticker inválido",
        details: "Usa un símbolo como AAPL, NVDA, TSLA o MSFT.",
      },
      { status: 400 }
    );
  }
  const ticker = tickerParam.toUpperCase();
  try {
    const body = await analyzeTicker(ticker, position);
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[analyze]", err);
    return NextResponse.json(
      { error: "No se pudo analizar el ticker", details: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const tickerParam = req.nextUrl.searchParams.get("ticker")?.trim() ?? "";
  const position = parsePositionFromQuery(req.nextUrl.searchParams);
  return runAnalyze(tickerParam, position);
}

export async function POST(req: NextRequest) {
  let body: { ticker?: string; position?: unknown } = {};
  try {
    body = (await req.json()) as { ticker?: string; position?: unknown };
  } catch {
    return NextResponse.json(
      { error: "JSON inválido", details: "Envía { ticker, position? }" },
      { status: 400 }
    );
  }
  const tickerParam = body.ticker?.trim() ?? "";
  return runAnalyze(tickerParam, body.position);
}
