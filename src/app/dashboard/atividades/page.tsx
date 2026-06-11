import Link from "next/link";
import { Plus, FileQuestion, ArrowRight, Clock } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  listManagerAssessments,
  listStudentAssessments,
} from "@/lib/online-assessments/queries";
import { formatDateTime } from "@/lib/utils";
import { submissionStatusLabel } from "@/lib/online-assessments/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AssessmentStatusBadge } from "@/components/online-assessments/status-badges";
import type { SubmissionStatus } from "@/types/models";

export default async function AtividadesPage() {
  const profile = await requireAuth();
  const isManager = hasPermission(profile.role, "grades.manage");

  // ---- Aluno: provas disponíveis -------------------------------------------
  if (profile.role === "aluno") {
    const items = await listStudentAssessments(profile.id);
    return (
      <>
        <PageHeader title="Provas e Atividades" description="Atividades online das suas turmas." />
        {items.length === 0 ? (
          <EmptyState icon={FileQuestion} title="Nenhuma prova" description="Não há atividades disponíveis no momento." />
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <Link key={a.id} href={`/dashboard/atividades/${a.id}`}>
                <Card className="group flex items-center justify-between p-4 transition-shadow hover:shadow-md">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    <p className="text-sm text-slate-500">
                      {a.className}
                      {a.subjectName ? ` · ${a.subjectName}` : ""}
                      {a.end_date ? ` · até ${formatDateTime(a.end_date)}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Tentativas: {a.attemptsUsed}/{a.max_attempts}
                      {a.lastStatus ? ` · ${submissionStatusLabel(a.lastStatus as SubmissionStatus)}` : ""}
                      {a.bestGrade != null ? ` · nota ${a.bestGrade}` : ""}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-indigo-500" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  // ---- Gestor / staff: lista de provas -------------------------------------
  const assessments = await listManagerAssessments();
  return (
    <>
      <PageHeader
        title="Provas e Atividades Online"
        description="Crie atividades e provas com correção automática ou manual."
        action={
          isManager ? (
            <Link href="/dashboard/atividades/nova">
              <Button>
                <Plus className="h-4 w-4" /> Nova prova
              </Button>
            </Link>
          ) : undefined
        }
      />
      {assessments.length === 0 ? (
        <EmptyState icon={FileQuestion} title="Nenhuma prova" description="Crie a primeira atividade online." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {assessments.map((a) => (
            <Link key={a.id} href={`/dashboard/atividades/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <FileQuestion className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{a.title}</p>
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  {a.className}
                  {a.subjectName ? ` · ${a.subjectName}` : ""}
                  {a.end_date && (
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateTime(a.end_date)}</span>
                  )}
                </p>
              </div>
              <span className="text-xs text-slate-500">{a.questionCount} questão(ões)</span>
              <span className="text-xs text-slate-500">{a.submissionCount} envio(s)</span>
              <AssessmentStatusBadge status={a.status} />
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
