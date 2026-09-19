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
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
      : streak.direction === "down"
        ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
        : "bg-slate-500/15 text-slate-300 border-slate-500/40";

  return (
    <div className={`rounded-xl border px-4 py-3 ${color}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold">
        {streak.direction === "neutral"
          ? DIR_LABEL.neutral
          : `${streak.length} día${streak.length === 1 ? "" : "s"} ${DIR_LABEL[streak.direction]}`}
      </p>
    </div>
  );
}
