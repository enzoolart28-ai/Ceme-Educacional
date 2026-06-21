import { BookOpen, LayoutGrid, Percent, ClipboardCheck, GraduationCap } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ListCard, SimpleRow } from "@/components/dashboard/list-card";
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
          value={hasRealFrequency ? formatPercent(frequency!.percent!) : "—"}
          icon={Percent}
          tone={hasRealFrequency && frequency!.lowFrequency ? "rose" : "emerald"}
          hint={hasRealFrequency ? "Dados reais (chamada)" : undefined}
        />
        <StatCard
          label="Aulas concluídas"
          value={hasRealProgress ? `${courseProgress!.completed}/${courseProgress!.total}` : "—"}
          icon={GraduationCap}
          tone="violet"
          hint={hasRealProgress ? "Dados reais (AVA)" : undefined}
        />
      </div>

      {hasRealProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso no curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {courseProgress!.completed}/{courseProgress!.total} aulas concluídas
              </span>
              <span className="font-semibold text-slate-900">{formatPercent(courseProgress!.percent ?? 0)}</span>
            </div>
            <ProgressBar value={(courseProgress!.percent ?? 0) * 100} tone="indigo" />
          </CardContent>
        </Card>
      )}

      <ListCard
        title="Notas recentes"
        icon={ClipboardCheck}
        isEmpty={!hasRealGrades}
        emptyText="Nenhuma nota lançada ainda."
      >
        {recentGrades.map((n) => (
          <SimpleRow
            key={n.id}
            title={n.subjectName ?? n.assessmentName}
            subtitle={n.subjectName ? n.assessmentName : undefined}
            trailing={`${n.grade} / ${n.maxGrade}`}
            trailingClass={gradeTone((n.grade / n.maxGrade) * 10)}
          />
        ))}
      </ListCard>
    </div>
  );
}
