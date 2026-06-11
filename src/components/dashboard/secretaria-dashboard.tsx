import { Users, ClipboardList, FileText, Inbox } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { mockSecretaria } from "@/lib/dashboard/mock";
import type { ProfileStats } from "@/lib/dashboard/types";

export function SecretariaDashboard({ stats }: { stats: ProfileStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Alunos ativos"
          value={formatNumber(stats.activeStudents)}
          icon={Users}
          tone="indigo"
          hint="Dados reais (perfis)"
        />
        <StatCard
          label="Matrículas pendentes"
          value={mockSecretaria.matriculasPendentes}
          icon={ClipboardList}
          tone="amber"
          isMock
        />
        <StatCard
          label="Documentos para emitir"
          value={mockSecretaria.documentosParaEmitir}
          icon={FileText}
          tone="sky"
          isMock
        />
        <StatCard
          label="Solicitações abertas"
          value={mockSecretaria.solicitacoesAbertas}
          icon={Inbox}
          tone="violet"
          isMock
        />
      </div>
    </div>
  );
}
