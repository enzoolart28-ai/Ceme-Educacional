import Link from "next/link";
import { IdCard, Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listStudents } from "@/lib/students/queries";
import { listClasses, listCourses } from "@/lib/academic/queries";
import { formatCpf } from "@/lib/students/cpf";
import { STUDENT_STATUS_LABELS } from "@/lib/students/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StudentFilters } from "@/components/students/student-filters";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import type { Student, StudentStatus } from "@/types/models";

const VALID_STATUS = Object.keys(STUDENT_STATUS_LABELS) as StudentStatus[];

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; classId?: string; courseId?: string }>;
}) {
  const profile = await requirePermission("students.read");
  const canManage = hasPermission(profile.role, "students.manage");
  const sp = await searchParams;

  const status =
    sp.status && VALID_STATUS.includes(sp.status as StudentStatus)
      ? (sp.status as StudentStatus)
      : undefined;

  const [students, courses, classes] = await Promise.all([
    listStudents({ q: sp.q, status, classId: sp.classId, courseId: sp.courseId }),
    listCourses(),
    listClasses(),
  ]);

  const columns: Column<Student>[] = [
    {
      header: "Nome",
      cell: (s) => (
        <Link
          href={`/dashboard/alunos/${s.id}`}
          className="font-medium text-indigo-700 hover:underline"
        >
          {s.full_name}
        </Link>
      ),
    },
    { header: "CPF", cell: (s) => formatCpf(s.cpf) },
    { header: "Telefone", cell: (s) => s.phone || "—" },
    { header: "Cidade/UF", cell: (s) => [s.city, s.state].filter(Boolean).join("/") || "—" },
    { header: "Status", cell: (s) => <StudentStatusBadge status={s.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Cadastro e gestão de alunos."
        action={
          canManage ? (
            <Link href="/dashboard/alunos/novo">
              <Button>
                <Plus className="h-4 w-4" /> Novo aluno
              </Button>
            </Link>
          ) : undefined
        }
      />

      <StudentFilters
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
      />

      <p className="mb-3 text-sm text-slate-500">
        {students.length} aluno(s) encontrado(s)
      </p>

      <DataTable
        columns={columns}
        data={students}
        getRowKey={(s) => s.id}
        emptyIcon={IdCard}
        emptyTitle="Nenhum aluno encontrado"
        emptyDescription="Ajuste os filtros ou cadastre um novo aluno."
      />
    </>
  );
}
