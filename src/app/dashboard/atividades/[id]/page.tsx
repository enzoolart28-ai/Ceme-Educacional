import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks, Users } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listClasses } from "@/lib/classes/queries";
import { listSubjects } from "@/lib/subjects/queries";
import { listTeachers } from "@/lib/teachers/queries";
import {
  getAssessment,
  getQuestionsWithOptions,
  getStudentSubmissions,
} from "@/lib/online-assessments/queries";
import { formatDateTime } from "@/lib/utils";
import { correctionTypeLabel } from "@/lib/online-assessments/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AssessmentForm } from "@/components/online-assessments/assessment-form";
import { QuestionManager } from "@/components/online-assessments/question-manager";
import {
  AssessmentStatusBadge,
  SubmissionStatusBadge,
} from "@/components/online-assessments/status-badges";
import {
  StartAttemptButton,
  AssessmentDeleteButton,
} from "@/components/online-assessments/action-buttons";
import type { OnlineAssessment } from "@/types/models";

/** ISO → valor de <input type="datetime-local"> (YYYY-MM-DDTHH:mm) em horário local. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function BackLink() {
  return (
    <Link href="/dashboard/atividades" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
      <ArrowLeft className="h-4 w-4" /> Voltar para provas
    </Link>
  );
}

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAuth();
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  const isManager = hasPermission(profile.role, "grades.manage");

  // ------------------------------------------------------------------ Aluno
  if (profile.role === "aluno") {
    const submissions = await getStudentSubmissions(id, profile.id);
    const hasInProgress = submissions.some((s) => s.status === "in_progress");
    const canStart =
      assessment.status === "published" && submissions.length < assessment.max_attempts;
    return (
      <>
        <BackLink />
        <PageHeader title={assessment.title} description={assessment.description ?? undefined} />
        <Card className="mb-6">
          <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Info label="Turma" value={assessment.className} />
            <Info label="Disciplina" value={assessment.subjectName ?? "—"} />
            <Info label="Prazo" value={assessment.end_date ? formatDateTime(assessment.end_date) : "—"} />
            <Info label="Tempo limite" value={assessment.time_limit_minutes ? `${assessment.time_limit_minutes} min` : "—"} />
            <Info label="Tentativas" value={`${submissions.length}/${assessment.max_attempts}`} />
            <Info label="Nota máxima" value={String(Number(assessment.max_grade))} />
          </CardContent>
        </Card>

        <div className="mb-6">
          {hasInProgress ? (
            <Link href={`/dashboard/atividades/${id}/responder/${submissions.find((s) => s.status === "in_progress")!.id}`}>
              <Button><ListChecks className="h-4 w-4" /> Continuar tentativa</Button>
            </Link>
          ) : canStart ? (
            <StartAttemptButton assessmentId={id} />
          ) : (
            <p className="text-sm text-slate-500">
              {assessment.status !== "published"
                ? "Esta prova não está disponível."
                : "Você já utilizou todas as tentativas."}
            </p>
          )}
        </div>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Suas tentativas</h2>
        {submissions.length === 0 ? (
          <EmptyState icon={ListChecks} title="Sem tentativas" description="Inicie a prova para registrar uma tentativa." />
        ) : (
          <Card className="divide-y divide-slate-100">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Tentativa {s.attempt_number}</p>
                  <p className="text-xs text-slate-500">
                    {s.submitted_at ? `Enviada em ${formatDateTime(s.submitted_at)}` : "Em andamento"}
                    {s.grade != null ? ` · nota ${Number(s.grade)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <SubmissionStatusBadge status={s.status} />
                  {s.status === "in_progress" ? (
                    <Link href={`/dashboard/atividades/${id}/responder/${s.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      Continuar
                    </Link>
                  ) : (
                    <Link href={`/dashboard/atividades/${id}/resultado/${s.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      Ver resultado
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}
      </>
    );
  }

  // ------------------------------------------------------------ Gestor / staff
  const questions = isManager ? await getQuestionsWithOptions(id) : [];
  return (
    <>
      <BackLink />
      <PageHeader
        title={assessment.title}
        description={`${assessment.className}${assessment.subjectName ? " · " + assessment.subjectName : ""} · correção ${correctionTypeLabel(assessment.correction_type)}`}
        action={
          <div className="flex items-center gap-2">
            <AssessmentStatusBadge status={assessment.status} />
            <Link href={`/dashboard/atividades/${id}/tentativas`}>
              <Button variant="outline"><Users className="h-4 w-4" /> Tentativas</Button>
            </Link>
            {isManager && <AssessmentDeleteButton id={id} />}
          </div>
        }
      />

      {!isManager ? (
        <Card>
          <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Info label="Início" value={assessment.start_date ? formatDateTime(assessment.start_date) : "—"} />
            <Info label="Prazo" value={assessment.end_date ? formatDateTime(assessment.end_date) : "—"} />
            <Info label="Tentativas" value={String(assessment.max_attempts)} />
            <Info label="Nota máxima" value={String(Number(assessment.max_grade))} />
          </CardContent>
        </Card>
      ) : (
        <ManagerEditor assessment={assessment} questions={questions} assessmentId={id} />
      )}
    </>
  );
}

async function ManagerEditor({
  assessment,
  questions,
  assessmentId,
}: {
  assessment: OnlineAssessment & { className: string };
  questions: Awaited<ReturnType<typeof getQuestionsWithOptions>>;
  assessmentId: string;
}) {
  const [classes, subjects, teachers] = await Promise.all([
    listClasses(),
    listSubjects(),
    listTeachers(),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Configurações</h2>
        <AssessmentForm
          mode="edit"
          assessmentId={assessmentId}
          classes={classes.map((c) => ({ id: c.id, name: c.name }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          teachers={teachers.map((t) => ({ id: t.id, name: t.full_name }))}
          defaultValues={{
            title: assessment.title,
            description: assessment.description ?? "",
            course_id: assessment.course_id ?? "",
            class_id: assessment.class_id,
            subject_id: assessment.subject_id ?? "",
            teacher_id: assessment.teacher_id ?? "",
            start_date: toLocalInput(assessment.start_date),
            end_date: toLocalInput(assessment.end_date),
            time_limit_minutes: assessment.time_limit_minutes ? String(assessment.time_limit_minutes) : "",
            max_attempts: String(assessment.max_attempts),
            max_grade: String(Number(assessment.max_grade)),
            min_grade: String(Number(assessment.min_grade)),
            correction_type: assessment.correction_type,
            show_answer_key: assessment.show_answer_key,
            shuffle_questions: assessment.shuffle_questions,
            shuffle_options: assessment.shuffle_options,
            status: assessment.status,
          }}
        />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Questões</h2>
        <QuestionManager assessmentId={assessmentId} questions={questions} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
