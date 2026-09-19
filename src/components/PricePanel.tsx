import type { PriceAnalysis } from "@/lib/types";
import { StreakBadge } from "./StreakBadge";

function money(n: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function PricePanel({
  price,
  companyName,
}: {
  price: PriceAnalysis;
  companyName: string;
}) {
  const { snapshot, streak7, streak30 } = price;
  const up = (snapshot.changePct ?? 0) >= 0;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{companyName}</p>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {snapshot.ticker}
          </h2>
          <p className="mt-2 text-4xl font-semibold tabular-nums text-white">
            {money(snapshot.price, snapshot.currency)}
          </p>
          {snapshot.changePct != null && (
            <p
              className={`mt-1 text-sm font-medium ${up ? "text-emerald-400" : "text-rose-400"}`}
            >
              {up ? "▲" : "▼"} {snapshot.changePct.toFixed(2)}% vs cierre previo
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Fuente: {snapshot.source === "yahoo" ? "Yahoo Finance" : "Demo"} ·{" "}
            {new Date(snapshot.asOf).toLocaleString("es-CO")}
          </p>
        </div>
        <div className="grid w-full gap-3 sm:w-auto sm:min-w-[220px]">
          <StreakBadge label="Racha 7 sesiones" streak={streak7} />
          <StreakBadge label="Racha 30 sesiones" streak={streak30} />
        </div>
      </div>
    </section>
  );
}
