import Link from "next/link";
import { MonitorPlay, ArrowRight, UsersRound } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listCourses } from "@/lib/academic/queries";
import {
  listEnrolledCourses,
  getStudentProgressByProfile,
  getStudentProgressById,
} from "@/lib/ava/queries";
import { getDependents } from "@/lib/guardians/queries";
import { formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AvaPage() {
  const profile = await requireAuth();

  // Gestores de conteúdo: gerenciam aulas dos cursos.
  if (
    hasPermission(profile.role, "courses.manage") ||
    hasPermission(profile.role, "curriculum.manage") ||
    hasPermission(profile.role, "grades.manage")
  ) {
    const courses = await listCourses();
    return (
      <>
        <PageHeader title="AVA / EAD" description="Gerencie aulas, materiais e conteúdo dos cursos." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/dashboard/ava/${c.id}`}>
              <Card className="group h-full p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <MonitorPlay className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{c.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Gerenciar aulas e materiais.</p>
              </Card>
            </Link>
          ))}
        </div>
      </>
    );
  }

  // Aluno: cursos matriculados + progresso.
  if (profile.role === "aluno") {
    const [courses, progress] = await Promise.all([
      listEnrolledCourses(profile.id),
      getStudentProgressByProfile(profile.id),
    ]);
    return (
      <>
        <PageHeader title="AVA / EAD" description="Seus cursos e aulas." />
        {progress.total > 0 && (
          <Card className="mb-6 p-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Progresso geral</span>
              <span className="font-semibold text-slate-900">
                {progress.completed}/{progress.total} aulas ·{" "}
                {progress.percent != null ? formatPercent(progress.percent) : "—"}
              </span>
            </div>
            <ProgressBar value={(progress.percent ?? 0) * 100} tone="indigo" />
          </Card>
        )}
        {courses.length === 0 ? (
          <EmptyState icon={MonitorPlay} title="Nenhum curso" description="Você ainda não está matriculado em cursos com conteúdo." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} href={`/dashboard/ava/${c.id}`}>
                <Card className="group h-full p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <MonitorPlay className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{c.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">Acessar aulas do curso.</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  // Responsável: progresso dos dependentes.
  const dependents = await getDependents(profile.id);
  const withProgress = await Promise.all(
    dependents.map(async (d) => ({
      name: d.student?.full_name ?? "—",
      progress: d.student ? await getStudentProgressById(d.student.id) : { total: 0, completed: 0, percent: null },
    })),
  );

  return (
    <>
      <PageHeader title="AVA / EAD" description="Progresso dos alunos vinculados a você." />
      {withProgress.length === 0 ? (
        <EmptyState icon={UsersRound} title="Nenhum dependente" description="Nenhum aluno vinculado a você." />
      ) : (
        <div className="space-y-4">
          {withProgress.map((d, i) => (
            <Card key={i} className="p-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">{d.name}</span>
                <span className="text-slate-500">
                  {d.progress.completed}/{d.progress.total} aulas ·{" "}
                  {d.progress.percent != null ? formatPercent(d.progress.percent) : "—"}
                </span>
              </div>
              <ProgressBar value={(d.progress.percent ?? 0) * 100} tone="indigo" />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
