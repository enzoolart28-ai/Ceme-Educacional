import { BarChart3 } from "lucide-react";
import { GESTOR_ROLES, requireRole } from "@/lib/auth/session";
import { getManagementDashboard } from "@/lib/management/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { StatCard } from "@/components/ui/stat-card";

function formatMetric(value: number, kind?: "money" | "number" | "percent") {
  if (kind === "money") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (kind === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("pt-BR");
}

export default async function RelatoriosGestaoPage() {
  await requireRole(GESTOR_ROLES);
  const dashboard = await getManagementDashboard();
  const groups = [
    ["Financeiro", dashboard.finance],
    ["Academico", dashboard.academic],
    ["Pedagogico", dashboard.pedagogical],
    ["Comercial", dashboard.commercial],
    ["Administrativo", dashboard.administrative],
  ] as const;

  return (
    <>
      <PageHeader title="Relatorios Gerenciais" description="Indicadores consolidados por area para acompanhamento do gestor." />
      <div className="space-y-8">
        {groups.map(([title, metrics]) => (
          <Section key={title} title={title}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <StatCard
                  key={`${title}-${metric.label}`}
                  label={metric.label}
                  value={formatMetric(metric.value, metric.kind)}
                  icon={BarChart3}
                />
              ))}
            </div>
          </Section>
        ))}
      </div>
    </>
  );
}
