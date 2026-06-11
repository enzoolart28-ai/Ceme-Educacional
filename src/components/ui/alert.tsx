import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "error" | "success" | "info" | "warning";

const toneConfig: Record<Tone, { wrap: string; icon: React.ElementType }> = {
  error: { wrap: "border-red-200 bg-red-50 text-red-800", icon: AlertCircle },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  info: { wrap: "border-sky-200 bg-sky-50 text-sky-800", icon: Info },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-800",
    icon: AlertTriangle,
  },
};

export function Alert({
  tone = "info",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  const { wrap, icon: Icon } = toneConfig[tone];
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        wrap,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
