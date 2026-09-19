import type { Recommendation } from "@/lib/types";

const ACTION_STYLE: Record<
  Recommendation["action"],
  { label: string; box: string }
> = {
  invertir: {
    label: "Invertir",
    box: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
  },
  mantener: {
    label: "Mantener",
    box: "border-sky-500/50 bg-sky-500/10 text-sky-200",
  },
  reducir: {
    label: "Reducir",
    box: "border-amber-500/50 bg-amber-500/10 text-amber-200",
  },
  retirar: {
    label: "Retirar",
    box: "border-rose-500/50 bg-rose-500/10 text-rose-200",
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
      className={`rounded-2xl border p-5 ${style.box}`}
      aria-label="Recomendación"
    >
      <p className="text-xs uppercase tracking-wider opacity-80">
        Paso 2 · Recomendación
      </p>
      <h2 className="mt-1 text-3xl font-bold">{style.label}</h2>
      <p className="mt-1 text-sm opacity-90">Confianza: {pct}%</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
        <div
          className="h-full rounded-full bg-white/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-4 text-sm leading-relaxed">{recommendation.rationale}</p>
      {recommendation.factors.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm opacity-90">
          {recommendation.factors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs opacity-70">
        Señales educativas del MVP — no constituyen asesoría financiera.
      </p>
    </section>
  );
}
