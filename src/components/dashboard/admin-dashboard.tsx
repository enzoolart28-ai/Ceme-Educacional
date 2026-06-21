import { Users, GraduationCap, LayoutGrid, BookOpen } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Section } from "@/components/ui/section";
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
    <Section title="Visão geral" description="Indicadores principais da instituição">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Alunos ativos" value={formatNumber(stats.activeStudents)} icon={Users} tone="indigo" hint="Dados reais (perfis)" />
        <StatCard label="Professores" value={formatNumber(stats.teachers)} icon={GraduationCap} tone="violet" hint="Dados reais (perfis)" />
        <StatCard label="Turmas" value={academic.classes} icon={LayoutGrid} tone="sky" hint="Dados reais (acadêmico)" />
        <StatCard label="Cursos ativos" value={academic.courses} icon={BookOpen} tone="emerald" hint="Dados reais (acadêmico)" />
      </div>
    </Section>
  );
}
