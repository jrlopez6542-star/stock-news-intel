"use client";

import { useMemo, useState } from "react";
import type { DailyBar } from "@/lib/types";

type WindowDays = 7 | 30;

export function PriceChart({ history }: { history: DailyBar[] }) {
  const [windowDays, setWindowDays] = useState<WindowDays>(30);

  const bars = useMemo(() => {
    if (!history.length) return [];
    return history.slice(-windowDays);
  }, [history, windowDays]);

  const stats = useMemo(() => {
    if (bars.length < 2) return null;
    const closes = bars.map((b) => b.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const first = closes[0]!;
    const last = closes[closes.length - 1]!;
    const changePct = ((last - first) / first) * 100;
    const pad = (max - min) * 0.1 || Math.abs(last) * 0.01 || 1;
    const yMin = min - pad;
    const yMax = max + pad;
    const w = 560;
    const h = 160;
    const coords = closes.map((c, i) => {
      const x = (i / (closes.length - 1)) * w;
      const y = h - ((c - yMin) / (yMax - yMin)) * h;
      return { x, y };
    });
    const line = coords.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const lastPt = coords[coords.length - 1]!;
    const area = `0,${h} ${line} ${w},${h}`;
    const up = changePct >= 0;
    return {
      changePct,
      up,
      min,
      max,
      w,
      h,
      line,
      area,
      lastPt,
      startLabel: bars[0]!.date,
      endLabel: bars[bars.length - 1]!.date,
    };
  }, [bars]);

  if (!stats) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500">
        Sin historial de cierres para graficar.
      </div>
    );
  }

  const stroke = stats.up ? "#34d399" : "#fb7185";

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Cierres diarios
          </p>
          <p
            className={`mt-0.5 text-sm font-semibold tabular-nums ${
              stats.up ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {stats.up ? "+" : ""}
            {stats.changePct.toFixed(2)}% en la ventana
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setWindowDays(d)}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                windowDays === d
                  ? "bg-slate-700 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${stats.w} ${stats.h}`}
        className="h-40 w-full"
        role="img"
        aria-label={`Gráfico de cierres ${windowDays} días`}
      >
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="0"
            x2={stats.w}
            y1={stats.h * t}
            y2={stats.h * t}
            stroke="rgba(148,163,184,0.12)"
            strokeWidth="1"
          />
        ))}
        <polygon points={stats.area} fill="url(#priceFill)" />
        <polyline
          points={stats.line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={stats.lastPt.x}
          cy={stats.lastPt.y}
          r="3.5"
          fill={stroke}
        />
      </svg>

      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>{stats.startLabel}</span>
        <span className="tabular-nums">
          máx {stats.max.toFixed(2)} · mín {stats.min.toFixed(2)}
        </span>
        <span>{stats.endLabel}</span>
      </div>
    </div>
  );
}
