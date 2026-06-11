import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getStudentBoletim, getStudentBoletimByProfile } from "@/lib/grades/queries";
import { getDependents } from "@/lib/guardians/queries";
import { listStudents } from "@/lib/students/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BoletimView } from "@/components/grades/boletim-view";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function BoletimPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const profile = await requireAuth();
  const sp = await searchParams;

  if (profile.role !== "admin" && profile.role !== "aluno" && profile.role !== "responsavel") {
    redirect("/sem-permissao");
  }

  // Administrador: visao total dos boletins de alunos cadastrados.
  if (profile.role === "admin") {
    const students = await listStudents();
    const selected =
      students.find((student) => student.id === sp.studentId) ??
      students[0] ??
      null;
    const subjects = selected ? await getStudentBoletim(selected.id) : [];

    return (
      <>
        <PageHeader
          title="Boletim"
          description="Acesso administrativo aos boletins de todos os alunos."
        />
        {students.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={BookOpen}
              title="Nenhum aluno cadastrado"
              description="Cadastre alunos para visualizar boletins nesta area."
            />
          </Card>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/dashboard/boletim?studentId=${student.id}`}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm",
                    selected?.id === student.id
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {student.full_name}
                </Link>
              ))}
            </div>
            <BoletimView subjects={subjects} />
          </>
        )}
      </>
    );
  }

  // Aluno: boletim próprio.
  if (profile.role === "aluno") {
    const data = await getStudentBoletimByProfile(profile.id);
    return (
      <>
        <PageHeader title="Meu boletim" description="Suas notas e situação acadêmica." />
        {data ? (
          <BoletimView subjects={data.subjects} />
        ) : (
          <Card className="p-6">
            <EmptyState icon={BookOpen} title="Sem cadastro de aluno" description="Seu cadastro de aluno ainda não foi vinculado." />
          </Card>
        )}
      </>
    );
  }

  // Responsável: escolhe entre os dependentes.
  const dependents = await getDependents(profile.id);
  const selected =
    dependents.find((d) => d.student?.id === sp.studentId)?.student ??
    dependents[0]?.student ??
    null;
  const subjects = selected ? await getStudentBoletim(selected.id) : [];

  return (
    <>
      <PageHeader title="Boletim" description="Notas e situação dos alunos vinculados a você." />
      {dependents.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={BookOpen}
            title="Nenhum dependente vinculado"
            description="Quando a secretaria vincular um aluno a você, o boletim aparecerá aqui."
          />
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {dependents.map((d) =>
              d.student ? (
                <Link
                  key={d.student.id}
                  href={`/dashboard/boletim?studentId=${d.student.id}`}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm",
                    selected?.id === d.student.id
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {d.student.full_name}
                </Link>
              ) : null,
            )}
          </div>
          <BoletimView subjects={subjects} />
        </>
      )}
    </>
  );
}
