import {
  LayoutGrid,
  Users,
  ClipboardList,
  FileEdit,
  CalendarClock,
  UserMinus,
} from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import {
  ListCard,
  TimelineRow,
  ProgressRow,
} from "@/components/dashboard/list-card";
import { mockProfessor } from "@/lib/dashboard/mock";
import type { TeacherAcademic } from "@/lib/academic/queries";

export function ProfessorDashboard({ academic }: { academic: TeacherAcademic }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Minhas turmas" value={academic.classCount} icon={LayoutGrid} tone="indigo" hint="Dados reais (acadêmico)" />
        <StatCard label="Meus alunos" value={academic.studentCount} icon={Users} tone="sky" hint="Dados reais (acadêmico)" />
        <StatCard label="Chamadas pendentes" value={mockProfessor.chamadasPendentes} icon={ClipboardList} tone="amber" isMock />
        <StatCard label="Para corrigir" value={mockProfessor.atividadesParaCorrigir} icon={FileEdit} tone="violet" isMock />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ListCard title="Aulas do dia" icon={CalendarClock} isMock>
          {mockProfessor.aulasDoDia.map((a, i) => (
            <TimelineRow key={i} time={a.time} title={a.title} subtitle={a.subtitle} />
          ))}
        </ListCard>

        <ListCard title="Alunos com baixa frequência" icon={UserMinus} isMock>
          {mockProfessor.alunosBaixaFrequencia.map((s, i) => (
            <ProgressRow
              key={i}
              label={`${s.name} · ${s.className}`}
              value={s.attendance * 100}
              valueLabel={formatPercent(s.attendance)}
              tone="rose"
            />
          ))}
        </ListCard>
      </div>

      <AlertsPanel items={mockProfessor.comunicados} title="Comunicados recentes" />
    </div>
  );
}
