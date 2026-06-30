import { BarChart3, Banknote, BookOpen, Briefcase, FileText } from "lucide-react";
import { GESTOR_ROLES, requireRole } from "@/lib/auth/session";
import { getManagementDashboard } from "@/lib/management/queries";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Section } from "@/components/ui/section";

function value(metric: { value: number; kind?: string }) {
  if (metric.kind === "money") return formatCurrency(metric.value);
  if (metric.kind === "percent") return `${metric.value.toFixed(1)}%`;
  return formatNumber(metric.value);
}

export default async function GestaoPage() {
  await requireRole(GESTOR_ROLES);
  const dashboard = await getManagementDashboard();
  const groups = [
    { title: "Financeiro", icon: Banknote, metrics: dashboard.finance },
    { title: "Acadêmico", icon: BookOpen, metrics: dashboard.academic },
    { title: "Pedagógico", icon: BarChart3, metrics: dashboard.pedagogical },
    { title: "Comercial", icon: Briefcase, metrics: dashboard.commercial },
    { title: "Administrativo", icon: FileText, metrics: dashboard.administrative },
  ];

  return (
    <>
      <PageHeader
        title="Gestão"
        description="Visão consolidada da empresa para acompanhamento, fiscalização e tomada de decisão."
      />
      <div className="space-y-8">
        {groups.map((group) => (
          <Section key={group.title} title={group.title}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {group.metrics.map((metric) => (
                <StatCard
                  key={`${group.title}-${metric.label}`}
                  label={metric.label}
                  value={value(metric)}
                  icon={group.icon}
                  tone="slate"
                />
              ))}
            </div>
          </Section>
        ))}
      </div>
    </>
  );
}

