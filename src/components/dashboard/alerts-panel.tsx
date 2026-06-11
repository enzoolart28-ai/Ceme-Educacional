import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { AlertItem, AlertSeverity } from "@/lib/dashboard/types";

const severityConfig: Record<
  AlertSeverity,
  { icon: LucideIcon; iconClass: string }
> = {
  info: { icon: Info, iconClass: "bg-sky-50 text-sky-600" },
  success: { icon: CheckCircle2, iconClass: "bg-emerald-50 text-emerald-600" },
  warning: { icon: AlertTriangle, iconClass: "bg-amber-50 text-amber-600" },
  danger: { icon: XCircle, iconClass: "bg-rose-50 text-rose-600" },
};

export function AlertsPanel({
  items,
  title = "Alertas recentes",
  action,
}: {
  items: AlertItem[];
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-slate-400" />
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={BellRing}
              title="Nenhum alerta"
              description="Você está em dia. Novos alertas aparecerão aqui."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const { icon: Icon, iconClass } = severityConfig[item.severity];
              return (
                <li key={item.id} className="flex gap-3 px-5 py-3.5">
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      iconClass,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
