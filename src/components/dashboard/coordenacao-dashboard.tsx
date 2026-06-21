import { GraduationCap, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import type { ProfileStats } from "@/lib/dashboard/types";

export function CoordenacaoDashboard({ stats }: { stats: ProfileStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Alunos ativos" value={formatNumber(stats.activeStudents)} icon={Users} tone="indigo" hint="Dados reais (perfis)" />
      <StatCard label="Professores" value={formatNumber(stats.teachers)} icon={GraduationCap} tone="violet" hint="Dados reais (perfis)" />
    </div>
  );
}
