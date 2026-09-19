import type { Recommendation } from "@/lib/types";

const ACTION_STYLE: Record<
  Recommendation["action"],
  { label: string; box: string; accent: string; hint: string }
> = {
  invertir: {
    label: "Invertir",
    box: "border-emerald-500/45 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-100",
    accent: "bg-emerald-400",
    hint: "Sesgo constructivo según noticias y precio",
  },
  mantener: {
    label: "Mantener",
    box: "border-sky-500/45 bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent text-sky-100",
    accent: "bg-sky-400",
    hint: "Equilibrio: no hay señal clara de cambio",
  },
  reducir: {
    label: "Reducir",
    box: "border-amber-500/45 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent text-amber-100",
    accent: "bg-amber-400",
    hint: "Riesgos o rachas sugieren recortar exposición",
  },
  retirar: {
    label: "Retirar",
    box: "border-rose-500/45 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent text-rose-100",
    accent: "bg-rose-400",
    hint: "Señales predominantemente negativas",
  },
};

export function RecommendationPanel({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const style = ACTION_STYLE[recommendation.action];
  const pct = Math.round(recommendation.confidence * 100);

  return (
    <section
      className={`rounded-2xl border p-5 shadow-lg shadow-black/20 ${style.box}`}
      aria-label="Recomendación"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
          Paso 2 · Recomendación
        </p>
        <span className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wide opacity-80">
          Desk signal
        </span>
      </div>
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {style.label}
      </h2>
      <p className="mt-1 text-sm opacity-85">{style.hint}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="opacity-90">Confianza</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/25">
        <div
          className={`h-full rounded-full ${style.accent}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-4 text-sm leading-relaxed opacity-95">
        {recommendation.rationale}
      </p>
      {recommendation.factors.length > 0 && (
        <ul className="mt-4 space-y-2">
          {recommendation.factors.map((f) => (
            <li
              key={f}
              className="flex gap-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-sm opacity-95"
            >
              <span className="mt-0.5 text-xs opacity-60">▸</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 border-t border-white/10 pt-3 text-xs opacity-70">
        Señales educativas — no constituyen asesoría financiera ni oferta de
        inversión.
      </p>
    </section>
  );
}
