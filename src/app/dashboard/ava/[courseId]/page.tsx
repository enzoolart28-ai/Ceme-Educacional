import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Lock, CheckCircle2, PlayCircle, Paperclip, MonitorPlay, ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getCourseById } from "@/lib/courses/queries";
import { listLessons, getStudentCourseView } from "@/lib/ava/queries";
import { formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { LessonStatusBadge } from "@/components/ava/lesson-status-badge";
import { LessonReorderButtons } from "@/components/ava/lesson-reorder-buttons";

function BackLink() {
  return (
    <Link
      href="/dashboard/ava"
      className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft className="h-4 w-4" /> Voltar ao AVA
    </Link>
  );
}

export default async function CourseLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const profile = await requireAuth();
  const course = await getCourseById(courseId);
  if (!course) notFound();

  const canManage =
    hasPermission(profile.role, "courses.manage") ||
    hasPermission(profile.role, "curriculum.manage") ||
    hasPermission(profile.role, "grades.manage");

  // -------------------------------------------------------------------------
  // Gestão de aulas
  // -------------------------------------------------------------------------
  if (canManage) {
    const lessons = await listLessons(courseId);
    return (
      <>
        <BackLink />
        <PageHeader
          title={course.name}
          description="Aulas do curso — organize a ordem, publique e gerencie materiais."
          action={
            <Link href={`/dashboard/ava/${courseId}/nova`}>
              <Button>
                <Plus className="h-4 w-4" /> Nova aula
              </Button>
            </Link>
          }
        />
        {lessons.length === 0 ? (
          <EmptyState icon={MonitorPlay} title="Nenhuma aula" description="Crie a primeira aula deste curso." />
        ) : (
          <Card className="divide-y divide-slate-100">
            {lessons.map((l, idx) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                <LessonReorderButtons id={l.id} courseId={courseId} />
                <span className="w-6 text-center text-sm font-medium text-slate-400">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/ava/${courseId}/aula/${l.id}`}
                    className="truncate font-medium text-slate-900 hover:text-indigo-700"
                  >
                    {l.title}
                  </Link>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Paperclip className="h-3 w-3" /> {l.materialCount} material(is)
                  </p>
                </div>
                <LessonStatusBadge status={l.status} />
                <Link
                  href={`/dashboard/ava/${courseId}/aula/${l.id}`}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Editar
                </Link>
              </div>
            ))}
          </Card>
        )}
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Visão do aluno (e responsável, somente leitura)
  // -------------------------------------------------------------------------
  const { lessons, progress } = await getStudentCourseView(courseId, profile.id);
  const isStudent = profile.role === "aluno";

  return (
    <>
      <BackLink />
      <PageHeader title={course.name} description="Aulas do curso." />
      {progress.total > 0 && (
        <Card className="mb-6 p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Seu progresso</span>
            <span className="font-semibold text-slate-900">
              {progress.completed}/{progress.total} aulas ·{" "}
              {progress.percent != null ? formatPercent(progress.percent) : "—"}
            </span>
          </div>
          <ProgressBar value={(progress.percent ?? 0) * 100} tone="indigo" />
        </Card>
      )}
      {lessons.length === 0 ? (
        <EmptyState icon={MonitorPlay} title="Nenhuma aula disponível" description="Este curso ainda não tem aulas publicadas." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {lessons.map((l, idx) => {
            const done = l.progress === "completed";
            const Icon = !l.released ? Lock : done ? CheckCircle2 : PlayCircle;
            const iconColor = !l.released
              ? "text-slate-300"
              : done
                ? "text-emerald-600"
                : "text-indigo-600";
            const body = (
              <div className="flex items-center gap-3 px-4 py-3">
                <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
                <span className="w-6 text-center text-sm font-medium text-slate-400">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${l.released ? "text-slate-900" : "text-slate-400"}`}>
                    {l.title}
                  </p>
                  {!l.released && l.reason && (
                    <p className="text-xs text-slate-400">{l.reason}</p>
                  )}
                  {l.released && done && (
                    <p className="text-xs text-emerald-600">Concluída</p>
                  )}
                </div>
              </div>
            );
            // Aluno acessa o player; responsável apenas visualiza a lista.
            return l.released && isStudent ? (
              <Link key={l.id} href={`/dashboard/ava/${courseId}/aula/${l.id}`} className="block hover:bg-slate-50">
                {body}
              </Link>
            ) : (
              <div key={l.id}>{body}</div>
            );
          })}
        </Card>
      )}
    </>
  );
}
