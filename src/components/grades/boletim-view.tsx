import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SituationBadge, AssessmentTypeBadge } from "@/components/grades/grade-badges";
import { assessmentTypeLabel } from "@/lib/grades/labels";
import { formatDate } from "@/lib/utils";
import type { BoletimSubject } from "@/lib/grades/queries";

export function BoletimView({ subjects }: { subjects: BoletimSubject[] }) {
  if (subjects.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={BookOpen}
          title="Sem notas"
          description="Ainda não há avaliações lançadas para este aluno."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {subjects.map((s) => (
        <Card key={s.subjectId}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{s.subjectName}</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                Média:{" "}
                <span className="font-semibold text-slate-900">
                  {s.average != null ? s.average.toFixed(2) : "—"}
                </span>
                <span className="text-slate-400"> / mín. {s.minGrade}</span>
              </span>
              <SituationBadge situation={s.situation} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-4 py-2 font-medium">Avaliação</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Peso</th>
                  <th className="px-4 py-2 text-right font-medium">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {s.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2 text-slate-800">{it.name}</td>
                    <td className="px-4 py-2">
                      <span className="hidden sm:inline">
                        <AssessmentTypeBadge type={it.type} />
                      </span>
                      <span className="sm:hidden text-slate-600">
                        {assessmentTypeLabel(it.type)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{formatDate(it.date)}</td>
                    <td className="px-4 py-2 text-slate-600">{it.weight}</td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900">
                      {it.grade != null ? `${it.grade} / ${it.maxGrade}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
