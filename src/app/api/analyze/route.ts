import { NextRequest, NextResponse } from "next/server";
import { getCompanyProfile } from "@/lib/company-context";
import { fetchNews } from "@/lib/news/provider";
import { fetchPriceAnalysis } from "@/lib/price/price-service";
import { buildRecommendation } from "@/lib/recommendation/recommender";
import { scoreNews } from "@/lib/scoring/news-scorer";
import type { AnalyzeResponse } from "@/lib/types";

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
    const profile = getCompanyProfile(ticker);
    const [price, newsResult] = await Promise.all([
      fetchPriceAnalysis(ticker),
      fetchNews(ticker),
    ]);

    const { news, scorer } = await scoreNews(newsResult.items, profile);
    const { recommendation, recommender } = await buildRecommendation(
      news,
      price,
      profile
    );

    const body: AnalyzeResponse = {
      ticker,
      company: profile,
      price,
      news,
      recommendation,
      meta: {
        newsProvider: newsResult.provider,
        priceSource: price.snapshot.source,
        scorer,
        recommender,
        generatedAt: new Date().toISOString(),
      },
    };

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
