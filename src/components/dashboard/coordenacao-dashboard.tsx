import {
  GraduationCap,
  UserX,
  ClipboardX,
  CalendarX,
  Percent,
  TrendingDown,
} from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import type { ProgressTone } from "@/components/ui/progress-bar";
import {
  ListCard,
  ProgressRow,
  SimpleRow,
} from "@/components/dashboard/list-card";
import { mockCoordenacao } from "@/lib/dashboard/mock";
import type { ProfileStats } from "@/lib/dashboard/types";

function attendanceTone(value: number): ProgressTone {
  if (value >= 0.85) return "emerald";
  if (value >= 0.75) return "amber";
  return "rose";
}

export function CoordenacaoDashboard({ stats }: { stats: ProfileStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Professores"
          value={formatNumber(stats.teachers)}
          icon={GraduationCap}
          tone="violet"
          hint="Dados reais (perfis)"
        />
        <StatCard label="Alunos abaixo de 75%" value={mockCoordenacao.alunosAbaixo75} icon={UserX} tone="rose" isMock />
        <StatCard label="Professores sem chamada" value={mockCoordenacao.professoresSemChamada} icon={ClipboardX} tone="amber" isMock />
        <StatCard label="Atividades atrasadas" value={mockCoordenacao.atividadesAtrasadas} icon={CalendarX} tone="sky" isMock />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ListCard title="Frequência por turma" icon={Percent} isMock>
          {mockCoordenacao.frequenciaPorTurma.map((t, i) => (
            <ProgressRow
              key={i}
              label={t.className}
              value={t.attendance * 100}
              valueLabel={formatPercent(t.attendance)}
              tone={attendanceTone(t.attendance)}
            />
          ))}
        </ListCard>

        <ListCard title="Turmas com baixo desempenho" icon={TrendingDown} isMock>
          {mockCoordenacao.turmasBaixoDesempenho.map((t, i) => (
            <ProgressRow
              key={i}
              label={t.className}
              value={t.attendance * 100}
              valueLabel={formatPercent(t.attendance)}
              tone="rose"
            />
          ))}
        </ListCard>
      </div>

      <ListCard title="Professores sem chamada lançada" icon={ClipboardX} isMock>
        {mockCoordenacao.professoresPendentes.map((p, i) => (
          <SimpleRow
            key={i}
            title={p.name}
            subtitle={`Turma ${p.className}`}
            trailing="Pendente"
            trailingClass="text-amber-600"
          />
        ))}
      </ListCard>
    </div>
  );
}
