import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getSubjectById } from "@/lib/subjects/queries";
import { PageHeader } from "@/components/ui/page-header";
import { SubjectForm } from "@/components/subjects/subject-form";

export default async function EditarDisciplinaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requirePermission("academic.read");
  if (
    !hasPermission(profile.role, "academic.manage") &&
    !hasPermission(profile.role, "curriculum.manage")
  ) {
    redirect("/sem-permissao");
  }

  const s = await getSubjectById(id);
  if (!s) notFound();

  return (
    <>
      <Link
        href="/dashboard/academico/disciplinas"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para disciplinas
      </Link>
      <PageHeader title={`Editar: ${s.name}`} description="Atualize os dados da disciplina." />
      <SubjectForm
        mode="edit"
        subjectId={id}
        defaultValues={{
          name: s.name,
          code: s.code ?? "",
          description: s.description ?? "",
          workload_hours: s.workload_hours != null ? String(s.workload_hours) : "",
          status: s.status,
        }}
      />
    </>
  );
}
