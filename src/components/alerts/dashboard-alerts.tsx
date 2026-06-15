import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import {
  generateAlertsIfAllowed,
  listDashboardAlerts,
  getAlertSummary,
} from "@/lib/alerts/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ALERT_PRIORITY_BADGE, alertPriorityLabel } from "@/lib/alerts/labels";
import type { AlertPriority } from "@/types/models";

/** Card de alertas relevantes para o dashboard. Retorna nada se não há alertas. */
export async function DashboardAlerts() {
  await generateAlertsIfAllowed();
  const [alerts, summary] = await Promise.all([listDashboardAlerts(5), getAlertSummary()]);
  if (alerts.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Bell className="h-4 w-4 text-amber-500" /> Alertas
          {summary.open > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{summary.open}</span>
          )}
        </h2>
        <Link href="/dashboard/alertas" className="inline-flex items-center text-xs font-medium text-indigo-600 hover:underline">
          Ver todos <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-start gap-3 px-4 py-3">
            <Badge className={ALERT_PRIORITY_BADGE[a.priority as AlertPriority]}>
              {alertPriorityLabel(a.priority as AlertPriority)}
            </Badge>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">{a.title}</p>
              {a.description && <p className="text-xs text-slate-500">{a.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
