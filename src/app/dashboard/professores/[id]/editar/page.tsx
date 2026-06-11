import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getTeacherById } from "@/lib/teachers/queries";
import { PageHeader } from "@/components/ui/page-header";
import { TeacherForm } from "@/components/teachers/teacher-form";

export default async function EditarProfessorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("teachers.manage");

  const t = await getTeacherById(id);
  if (!t) notFound();

  return (
    <>
      <Link
        href={`/dashboard/professores/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o professor
      </Link>
      <PageHeader title={`Editar: ${t.full_name}`} description="Atualize os dados do professor." />
      <TeacherForm
        mode="edit"
        teacherId={id}
        defaultValues={{
          full_name: t.full_name,
          cpf: t.cpf ?? "",
          rg: t.rg ?? "",
          phone: t.phone ?? "",
          email: t.email ?? "",
          education: t.education ?? "",
          expertise_area: t.expertise_area ?? "",
          workload: t.workload != null ? String(t.workload) : "",
          status: t.status,
          notes: t.notes ?? "",
        }}
      />
    </>
  );
}
