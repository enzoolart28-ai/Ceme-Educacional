import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MockBadge } from "@/components/ui/mock-badge";

export type StatTone =
  | "indigo"
  | "emerald"
  | "amber"
  | "sky"
  | "rose"
  | "violet"
  | "slate";

const toneClasses: Record<StatTone, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
};

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: StatTone;
  /** Marca o cartão como dado de exemplo (mock). */
  isMock?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "indigo",
  isMock = false,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            toneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>

      <div className="mt-1 flex items-center gap-2">
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
        {isMock && <MockBadge />}
      </div>
    </Card>
  );
}
