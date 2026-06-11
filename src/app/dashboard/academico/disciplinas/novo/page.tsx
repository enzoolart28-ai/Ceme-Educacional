import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SubjectForm } from "@/components/subjects/subject-form";

export default async function NovaDisciplinaPage() {
  const profile = await requirePermission("academic.read");
  if (
    !hasPermission(profile.role, "academic.manage") &&
    !hasPermission(profile.role, "curriculum.manage")
  ) {
    redirect("/sem-permissao");
  }

  return (
    <>
      <Link
        href="/dashboard/academico/disciplinas"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para disciplinas
      </Link>
      <PageHeader title="Nova disciplina" description="Cadastre uma nova disciplina." />
      <SubjectForm
        mode="create"
        defaultValues={{ name: "", code: "", description: "", workload_hours: "", status: "active" }}
      />
    </>
  );
}
