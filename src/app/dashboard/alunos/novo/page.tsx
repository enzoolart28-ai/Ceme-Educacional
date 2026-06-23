import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "@/components/students/student-form";
import { listStudents } from "@/lib/students/queries";

export default async function NovoAlunoPage() {
  await requirePermission("students.manage");

  const existing = await listStudents();
  const students = existing.map((s) => ({ id: s.id, name: s.full_name }));

  return (
    <>
      <Link
        href="/dashboard/alunos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para alunos
      </Link>
      <PageHeader title="Novo aluno" description="Cadastre um novo aluno." />
      <StudentForm
        mode="create"
        students={students}
        defaultValues={{
          full_name: "",
          cpf: "",
          rg: "",
          birth_date: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          state: "",
          mother_name: "",
          father_name: "",
          status: "active",
          notes: "",
        }}
      />
    </>
  );
}
