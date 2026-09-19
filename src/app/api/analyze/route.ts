import { NextRequest, NextResponse } from "next/server";
import { analyzeTicker } from "@/lib/analyze-ticker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TICKER_RE = /^[A-Za-z.]{1,10}$/;

export async function GET(req: NextRequest) {
  const tickerParam = req.nextUrl.searchParams.get("ticker")?.trim() ?? "";
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
    const body = await analyzeTicker(ticker);
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
