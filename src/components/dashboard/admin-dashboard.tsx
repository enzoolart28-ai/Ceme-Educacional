import {
  Users,
  GraduationCap,
  LayoutGrid,
  BookOpen,
  TrendingUp,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Section } from "@/components/ui/section";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { mockAdmin, mockAdminAlerts } from "@/lib/dashboard/mock";
import type { ProfileStats } from "@/lib/dashboard/types";
import type { AcademicCounts } from "@/lib/academic/queries";

export function AdminDashboard({
  stats,
  academic,
}: {
  stats: ProfileStats;
  academic: AcademicCounts;
}) {
  return (
    <div className="space-y-8">
      <Section
        title="Visão geral"
        description="Indicadores principais da instituição"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Alunos ativos"
            value={formatNumber(stats.activeStudents)}
            icon={Users}
            tone="indigo"
            hint="Dados reais (perfis)"
          />
          <StatCard
            label="Professores"
            value={formatNumber(stats.teachers)}
            icon={GraduationCap}
            tone="violet"
            hint="Dados reais (perfis)"
          />
          <StatCard
            label="Turmas"
            value={academic.classes}
            icon={LayoutGrid}
            tone="sky"
            hint="Dados reais (acadêmico)"
          />
          <StatCard
            label="Cursos ativos"
            value={academic.courses}
            icon={BookOpen}
            tone="emerald"
            hint="Dados reais (acadêmico)"
          />
        </div>
      </Section>

      <Section title="Financeiro" description="Resumo do mês corrente">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Receita prevista"
            value={formatCurrency(mockAdmin.receitaPrevista)}
            icon={TrendingUp}
            tone="sky"
            isMock
          />
          <StatCard
            label="Receita recebida"
            value={formatCurrency(mockAdmin.receitaRecebida)}
            icon={Wallet}
            tone="emerald"
            isMock
          />
          <StatCard
            label="Inadimplência"
            value={formatPercent(mockAdmin.inadimplencia)}
            icon={AlertTriangle}
            tone="rose"
            isMock
          />
        </div>
      </Section>

      <Section title="Alertas">
        <AlertsPanel items={mockAdminAlerts} />
      </Section>
    </div>
  );
}
