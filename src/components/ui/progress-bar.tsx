import { cn } from "@/lib/utils";

const toneClasses = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
} as const;

export type ProgressTone = keyof typeof toneClasses;

export function ProgressBar({
  value,
  tone = "indigo",
  className,
}: {
  /** Percentual de 0 a 100. */
  value: number;
  tone?: ProgressTone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", toneClasses[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
