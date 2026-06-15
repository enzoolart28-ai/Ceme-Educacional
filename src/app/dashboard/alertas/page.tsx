import { Bell, AlertTriangle, Flame, Eye } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  generateAlertsIfAllowed,
  listAlerts,
  getAlertSummary,
} from "@/lib/alerts/queries";
import {
  ALERT_PRIORITY_BADGE,
  ALERT_STATUS_BADGE,
  alertPriorityLabel,
  alertStatusLabel,
  alertTypeLabel,
} from "@/lib/alerts/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertFilters } from "@/components/alerts/alert-filters";
import { AlertActions } from "@/components/alerts/alert-actions";
import { GenerateAlertsButton } from "@/components/alerts/generate-alerts-button";
import type {
  AlertPriority,
  AlertStatus,
  AlertType,
} from "@/types/models";

const PRIORITIES: AlertPriority[] = ["baixa", "media", "alta", "critica"];
const STATUSES: AlertStatus[] = ["novo", "visualizado", "resolvido", "ignorado"];

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireAuth();
  const sp = await searchParams;
  const canManage = hasPermission(profile.role, "alerts.manage");

  const priority = one(sp.priority);
  const type = one(sp.type);
  const status = one(sp.status);

  const filters = {
    priority: priority && PRIORITIES.includes(priority as AlertPriority) ? (priority as AlertPriority) : undefined,
    type: type ? (type as AlertType) : undefined,
    status: status && STATUSES.includes(status as AlertStatus) ? (status as AlertStatus) : undefined,
  };

  await generateAlertsIfAllowed();
  const [alerts, summary] = await Promise.all([listAlerts(filters), getAlertSummary()]);

  return (
    <>
      <PageHeader
        title="Alertas Automáticos"
        description="Situações acadêmicas, financeiras, pedagógicas e comerciais que precisam de atenção."
        action={canManage ? <GenerateAlertsButton /> : undefined}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Em aberto" value={summary.open} icon={Bell} tone="indigo" />
        <StatCard label="Novos" value={summary.novo} icon={Eye} tone="sky" />
        <StatCard label="Alta prioridade" value={summary.byPriority.alta} icon={AlertTriangle} tone="amber" />
        <StatCard label="Críticos" value={summary.byPriority.critica} icon={Flame} tone="rose" />
      </div>

      <AlertFilters />

      {alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhum alerta"
          description={canManage ? 'Clique em "Gerar alertas" para varrer os dados.' : "Nenhum alerta relevante no momento."}
        />
      ) : (
        <Card className="divide-y divide-slate-100">
          {alerts.map((a) => {
            const context = [
              a.studentName,
              a.className ? `Turma ${a.className}` : null,
              a.userName,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div key={a.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={ALERT_PRIORITY_BADGE[a.priority as AlertPriority]}>
                      {alertPriorityLabel(a.priority as AlertPriority)}
                    </Badge>
                    <Badge className={ALERT_STATUS_BADGE[a.status as AlertStatus]}>
                      {alertStatusLabel(a.status as AlertStatus)}
                    </Badge>
                    <span className="text-xs text-slate-400">{alertTypeLabel(a.type as AlertType)}</span>
                  </div>
                  <p className="mt-1 font-medium text-slate-900">{a.title}</p>
                  {a.description && <p className="text-sm text-slate-600">{a.description}</p>}
                  <p className="mt-0.5 text-xs text-slate-400">
                    {[context, formatDate(a.created_at)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {canManage && (
                  <div className="shrink-0">
                    <AlertActions id={a.id} status={a.status as AlertStatus} />
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}
