import type { StreakResult } from "@/lib/types";

const DIR_LABEL = {
  up: "alcista",
  down: "bajista",
  neutral: "sin racha",
} as const;

export function StreakBadge({
  label,
  streak,
}: {
  label: string;
  streak: StreakResult;
}) {
  const color =
    streak.direction === "up"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/35"
      : streak.direction === "down"
        ? "bg-rose-500/10 text-rose-300 border-rose-500/35"
        : "bg-slate-500/10 text-slate-300 border-slate-500/35";

  const barColor =
    streak.direction === "up"
      ? "bg-emerald-400"
      : streak.direction === "down"
        ? "bg-rose-400"
        : "bg-slate-500";

  const closes = streak.closes;
  const min = closes.length ? Math.min(...closes) : 0;
  const max = closes.length ? Math.max(...closes) : 1;
  const span = max - min || 1;

  return (
    <div className={`rounded-xl border px-4 py-3 ${color}`}>
      <p className="text-[11px] font-medium uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold leading-tight">
        {streak.direction === "neutral"
          ? DIR_LABEL.neutral
          : `${streak.length} día${streak.length === 1 ? "" : "s"} ${DIR_LABEL[streak.direction]}`}
      </p>
      {closes.length > 1 && (
        <div
          className="mt-3 flex h-8 items-end gap-0.5"
          aria-hidden
          title="Cierres de la ventana"
        >
          {closes.map((c, i) => {
            const h = 20 + ((c - min) / span) * 12;
            const isTail = i >= closes.length - Math.max(streak.length, 1);
            return (
              <div
                key={`${i}-${c}`}
                className={`flex-1 rounded-sm ${barColor} ${
                  isTail && streak.direction !== "neutral"
                    ? "opacity-100"
                    : "opacity-35"
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
