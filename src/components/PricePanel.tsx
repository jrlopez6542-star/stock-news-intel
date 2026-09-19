import type { PriceAnalysis } from "@/lib/types";
import { PriceChart } from "./PriceChart";
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
  const { snapshot, streak7, streak30, history } = price;
  const up = (snapshot.changePct ?? 0) >= 0;
  const isDemo = snapshot.source === "demo";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 shadow-xl shadow-black/30">
      <div className="border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-slate-400">{companyName}</p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  isDemo
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {isDemo ? "Fuente: demo" : "Fuente: Yahoo Finance"}
              </span>
            </div>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {snapshot.ticker}
            </h2>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-white sm:text-5xl">
              {money(snapshot.price, snapshot.currency)}
            </p>
            {snapshot.changePct != null && (
              <p
                className={`mt-1 text-sm font-medium ${up ? "text-emerald-400" : "text-rose-400"}`}
              >
                {up ? "▲" : "▼"} {Math.abs(snapshot.changePct).toFixed(2)}% vs
                cierre previo
                {snapshot.previousClose != null && (
                  <span className="ml-2 text-slate-500">
                    ({money(snapshot.previousClose, snapshot.currency)})
                  </span>
                )}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Actualizado{" "}
              {new Date(snapshot.asOf).toLocaleString("es-CO", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {isDemo && " · serie sintética (Yahoo no disponible)"}
            </p>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:min-w-[240px]">
            <StreakBadge label="Racha 7 sesiones" streak={streak7} />
            <StreakBadge label="Racha 30 sesiones" streak={streak30} />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 sm:px-6">
        <PriceChart history={history} />
      </div>
    </section>
  );
}
