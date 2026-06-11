import { User, LayoutGrid, Percent, Wallet } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { mockResponsavel } from "@/lib/dashboard/mock";

export function ResponsavelDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aluno vinculado" value={mockResponsavel.alunoVinculado} icon={User} tone="indigo" isMock />
        <StatCard label="Turma" value={mockResponsavel.turma} icon={LayoutGrid} tone="sky" isMock />
        <StatCard
          label="Frequência"
          value={formatPercent(mockResponsavel.frequencia)}
          icon={Percent}
          tone="emerald"
          isMock
        />
        <StatCard label="Mensalidade" value={mockResponsavel.mensalidadeStatus} icon={Wallet} tone="violet" isMock />
      </div>

      <AlertsPanel items={mockResponsavel.comunicados} title="Comunicados recentes" />
    </div>
  );
}
