import type { CatalystItem } from "@/lib/types";

const TYPE_STYLE: Record<
  CatalystItem["type"],
  { label: string; chip: string }
> = {
  earnings: {
    label: "Earnings",
    chip: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  },
  macro: {
    label: "Macro",
    chip: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  company: {
    label: "Empresa",
    chip: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  },
  other: {
    label: "Otro",
    chip: "border-slate-600 bg-slate-800/60 text-slate-300",
  },
};

function formatDate(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function CatalystsPanel({
  catalysts,
  ticker,
}: {
  catalysts: CatalystItem[];
  ticker: string;
}) {
  const hasEarnings = catalysts.some((c) => c.type === "earnings");

  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20"
      aria-label="Catalizadores"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Calendario · Catalizadores
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Catalizadores · {ticker}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Earnings (Yahoo) + macro de contexto · fechas aproximadas
          </p>
        </div>
        <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] uppercase tracking-wide text-slate-400">
          {catalysts.length} ítem{catalysts.length === 1 ? "" : "s"}
        </span>
      </div>

      {!hasEarnings && (
        <div className="mt-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
          No se pudo cargar el calendario de earnings en vivo. Se muestran
          placeholders macro y/o notas del perfil cuando existen.
        </div>
      )}

      {catalysts.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
          Sin catalizadores disponibles por ahora. Reintenta más tarde o revisa
          el perfil de la empresa.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {catalysts.map((c, i) => {
            const style = TYPE_STYLE[c.type];
            return (
              <li
                key={`${c.date}-${c.title}-${i}`}
                className="rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <time
                    dateTime={c.date}
                    className="font-mono text-xs tabular-nums text-slate-400"
                  >
                    {formatDate(c.date)}
                  </time>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.chip}`}
                  >
                    {style.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-600">
                    {c.source}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-100">
                  {c.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {c.note}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
