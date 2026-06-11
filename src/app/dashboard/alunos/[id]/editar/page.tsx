import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getStudentById } from "@/lib/students/queries";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "@/components/students/student-form";

export default async function EditarAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("students.manage");

  const s = await getStudentById(id);
  if (!s) notFound();

  return (
    <>
      <Link
        href={`/dashboard/alunos/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o aluno
      </Link>
      <PageHeader title={`Editar: ${s.full_name}`} description="Atualize os dados do aluno." />
      <StudentForm
        mode="edit"
        studentId={id}
        defaultValues={{
          full_name: s.full_name,
          cpf: s.cpf ?? "",
          rg: s.rg ?? "",
          birth_date: s.birth_date ?? "",
          phone: s.phone ?? "",
          email: s.email ?? "",
          address: s.address ?? "",
          city: s.city ?? "",
          state: s.state ?? "",
          mother_name: s.mother_name ?? "",
          father_name: s.father_name ?? "",
          status: s.status,
          notes: s.notes ?? "",
        }}
      />
    </>
  );
}
