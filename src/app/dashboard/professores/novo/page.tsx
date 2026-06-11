import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { TeacherForm } from "@/components/teachers/teacher-form";

export default async function NovoProfessorPage() {
  await requirePermission("teachers.manage");

  return (
    <>
      <Link
        href="/dashboard/professores"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para professores
      </Link>
      <PageHeader title="Novo professor" description="Cadastre um novo professor." />
      <TeacherForm
        mode="create"
        defaultValues={{
          full_name: "",
          cpf: "",
          rg: "",
          phone: "",
          email: "",
          education: "",
          expertise_area: "",
          workload: "",
          status: "active",
          notes: "",
        }}
      />
    </>
  );
}
