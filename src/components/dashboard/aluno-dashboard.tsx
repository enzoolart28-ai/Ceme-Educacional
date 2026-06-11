import {
  BookOpen,
  LayoutGrid,
  CalendarClock,
  ListTodo,
  Percent,
  ClipboardCheck,
} from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MockBadge } from "@/components/ui/mock-badge";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import {
  ListCard,
  TimelineRow,
  SimpleRow,
} from "@/components/dashboard/list-card";
import { mockAluno } from "@/lib/dashboard/mock";
import type { StudentAcademic } from "@/lib/academic/queries";
import type { FrequencySummary } from "@/lib/attendance/frequency";
import type { RecentGrade } from "@/lib/grades/queries";
import type { CourseProgress } from "@/lib/ava/queries";

function gradeTone(grade: number): string {
  if (grade >= 7) return "text-emerald-600";
  if (grade >= 5) return "text-amber-600";
  return "text-rose-600";
}

export function AlunoDashboard({
  academic,
  frequency,
  recentGrades,
  courseProgress,
}: {
  academic: StudentAcademic | null;
  frequency: FrequencySummary | null;
  recentGrades: RecentGrade[];
  courseProgress?: CourseProgress | null;
}) {
  const hasRealFrequency = frequency != null && frequency.total > 0;
  const hasRealGrades = recentGrades.length > 0;
  const hasRealProgress = courseProgress != null && courseProgress.total > 0;
  const progressFraction = hasRealProgress
    ? courseProgress!.percent ?? 0
    : mockAluno.progressoCurso;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Curso atual"
          value={academic?.courseName ?? "Sem matrícula"}
          icon={BookOpen}
          tone="indigo"
          hint={academic ? "Dados reais (acadêmico)" : undefined}
        />
        <StatCard
          label="Turma"
          value={academic?.className ?? "—"}
          icon={LayoutGrid}
          tone="sky"
          hint={academic ? "Dados reais (acadêmico)" : undefined}
        />
        <StatCard
          label="Frequência geral"
          value={formatPercent(hasRealFrequency ? frequency!.percent! : mockAluno.frequencia)}
          icon={Percent}
          tone={hasRealFrequency && frequency!.lowFrequency ? "rose" : "emerald"}
          hint={hasRealFrequency ? "Dados reais (chamada)" : undefined}
          isMock={!hasRealFrequency}
        />
        <StatCard
          label="Atividades pendentes"
          value={mockAluno.atividadesPendentes.length}
          icon={ListTodo}
          tone="amber"
          isMock
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Progresso no curso</CardTitle>
          {!hasRealProgress && <MockBadge />}
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {hasRealProgress
                ? `${courseProgress!.completed}/${courseProgress!.total} aulas concluídas`
                : "Conclusão estimada"}
            </span>
            <span className="font-semibold text-slate-900">{formatPercent(progressFraction)}</span>
          </div>
          <ProgressBar value={progressFraction * 100} tone="indigo" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ListCard title="Próximas aulas" icon={CalendarClock} isMock>
          {mockAluno.proximasAulas.map((a, i) => (
            <TimelineRow key={i} time={a.time} title={a.title} subtitle={a.subtitle} />
          ))}
        </ListCard>

        <ListCard title="Atividades pendentes" icon={ListTodo} isMock>
          {mockAluno.atividadesPendentes.map((a, i) => (
            <SimpleRow key={i} title={a.title} subtitle={a.subtitle} trailing={a.due} trailingClass="text-amber-600" />
          ))}
        </ListCard>

        <ListCard title="Notas recentes" icon={ClipboardCheck} isMock={!hasRealGrades}>
          {hasRealGrades
            ? recentGrades.map((n) => (
                <SimpleRow
                  key={n.id}
                  title={n.subjectName ?? n.assessmentName}
                  subtitle={n.subjectName ? n.assessmentName : undefined}
                  trailing={`${n.grade} / ${n.maxGrade}`}
                  trailingClass={gradeTone((n.grade / n.maxGrade) * 10)}
                />
              ))
            : mockAluno.notasRecentes.map((n, i) => (
                <SimpleRow
                  key={i}
                  title={n.subject}
                  trailing={n.grade.toFixed(1)}
                  trailingClass={gradeTone(n.grade)}
                />
              ))}
        </ListCard>

        <AlertsPanel items={mockAluno.comunicados} title="Comunicados recentes" />
      </div>
    </div>
  );
}
