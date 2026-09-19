"use client";

import { useEffect, useState } from "react";
import type {
  HorizonUnit,
  PositionContext,
  RiskTolerance,
} from "@/lib/types";
import { loadPosition, savePosition } from "@/lib/position-storage";

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-emerald-500/40 placeholder:text-slate-600 focus:ring-2";

const labelCls = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500";

export function PositionContextPanel({
  ticker,
  onChange,
}: {
  ticker: string;
  onChange: (ctx: PositionContext) => void;
}) {
  const [sharesHeld, setSharesHeld] = useState("");
  const [avgEntryPrice, setAvgEntryPrice] = useState("");
  const [portfolioPct, setPortfolioPct] = useState("");
  const [horizonValue, setHorizonValue] = useState("");
  const [horizonUnit, setHorizonUnit] = useState<HorizonUnit | "">("");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance | "">("");

  useEffect(() => {
    const saved = loadPosition(ticker);
    setSharesHeld(saved.sharesHeld != null ? String(saved.sharesHeld) : "");
    setAvgEntryPrice(
      saved.avgEntryPrice != null ? String(saved.avgEntryPrice) : ""
    );
    setPortfolioPct(
      saved.portfolioPct != null ? String(saved.portfolioPct) : ""
    );
    setHorizonValue(
      saved.horizonValue != null ? String(saved.horizonValue) : ""
    );
    setHorizonUnit(saved.horizonUnit ?? "");
    setRiskTolerance(saved.riskTolerance ?? "");
    onChange(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when ticker changes
  }, [ticker]);

  function buildCtx(): PositionContext {
    return {
      sharesHeld: sharesHeld === "" ? null : Number(sharesHeld),
      avgEntryPrice: avgEntryPrice === "" ? null : Number(avgEntryPrice),
      portfolioPct: portfolioPct === "" ? null : Number(portfolioPct),
      horizonValue: horizonValue === "" ? null : Number(horizonValue),
      horizonUnit: horizonUnit || null,
      riskTolerance: riskTolerance || null,
    };
  }

  function persist(next?: PositionContext) {
    const ctx = next ?? buildCtx();
    savePosition(ticker, ctx);
    onChange(ctx);
  }

  function clearAll() {
    setSharesHeld("");
    setAvgEntryPrice("");
    setPortfolioPct("");
    setHorizonValue("");
    setHorizonUnit("");
    setRiskTolerance("");
    const empty: PositionContext = {};
    savePosition(ticker, empty);
    onChange(empty);
  }

  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20"
      aria-label="Contexto de posición"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Contexto · Posición y horizonte
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Tu posición en {ticker}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Opcional · se guarda en este navegador (localStorage) · alimenta la
            recomendación (aumentar / mantener / reducir / salir)
          </p>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400 hover:border-slate-500 hover:text-slate-200"
        >
          Limpiar
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="sharesHeld">
            Acciones
          </label>
          <input
            id="sharesHeld"
            className={inputCls}
            type="number"
            min={0}
            step="any"
            placeholder="0 = flat"
            value={sharesHeld}
            onChange={(e) => setSharesHeld(e.target.value)}
            onBlur={() => persist()}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="avgEntry">
            Precio medio de entrada
          </label>
          <input
            id="avgEntry"
            className={inputCls}
            type="number"
            min={0}
            step="any"
            placeholder="Cost basis"
            value={avgEntryPrice}
            onChange={(e) => setAvgEntryPrice(e.target.value)}
            onBlur={() => persist()}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="portPct">
            % del portafolio (opc.)
          </label>
          <input
            id="portPct"
            className={inputCls}
            type="number"
            min={0}
            max={100}
            step="any"
            placeholder="ej. 8"
            value={portfolioPct}
            onChange={(e) => setPortfolioPct(e.target.value)}
            onBlur={() => persist()}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls} htmlFor="horizonVal">
              Horizonte
            </label>
            <input
              id="horizonVal"
              className={inputCls}
              type="number"
              min={1}
              step={1}
              placeholder="ej. 6"
              value={horizonValue}
              onChange={(e) => setHorizonValue(e.target.value)}
              onBlur={() => persist()}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="horizonUnit">
              Unidad
            </label>
            <select
              id="horizonUnit"
              className={inputCls}
              value={horizonUnit}
              onChange={(e) => {
                const v = e.target.value as HorizonUnit | "";
                setHorizonUnit(v);
                const ctx = { ...buildCtx(), horizonUnit: v || null };
                persist(ctx);
              }}
            >
              <option value="">—</option>
              <option value="dias">días</option>
              <option value="meses">meses</option>
              <option value="anos">años</option>
            </select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="risk">
            Tolerancia al riesgo
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["conservador", "Conservador"],
                ["moderado", "Moderado"],
                ["agresivo", "Agresivo"],
              ] as const
            ).map(([val, label]) => {
              const active = riskTolerance === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    const next = active ? "" : val;
                    setRiskTolerance(next);
                    persist({
                      ...buildCtx(),
                      riskTolerance: next || null,
                    });
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-4 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
        Educativo: no es asesoría financiera. Los campos solo contextualizan la
        señal del desk.
      </p>
    </section>
  );
}
