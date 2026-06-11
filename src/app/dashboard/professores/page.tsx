import Link from "next/link";
import { Presentation, Plus } from "lucide-react";
import { requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listTeachers } from "@/lib/teachers/queries";
import { formatCpf } from "@/lib/students/cpf";
import { TEACHER_STATUS_LABELS } from "@/lib/teachers/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { TeacherFilters } from "@/components/teachers/teacher-filters";
import { TeacherStatusBadge } from "@/components/teachers/teacher-status-badge";
import type { Teacher, TeacherStatus } from "@/types/models";

const VALID = Object.keys(TEACHER_STATUS_LABELS) as TeacherStatus[];

export default async function ProfessoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; area?: string; status?: string }>;
}) {
  const profile = await requireRole(STAFF_ROLES);
  const canManage = hasPermission(profile.role, "teachers.manage");
  const sp = await searchParams;
  const status =
    sp.status && VALID.includes(sp.status as TeacherStatus)
      ? (sp.status as TeacherStatus)
      : undefined;

  const teachers = await listTeachers({ q: sp.q, area: sp.area, status });

  const columns: Column<Teacher>[] = [
    {
      header: "Nome",
      cell: (t) => (
        <Link
          href={`/dashboard/professores/${t.id}`}
          className="font-medium text-indigo-700 hover:underline"
        >
          {t.full_name}
        </Link>
      ),
    },
    { header: "CPF", cell: (t) => formatCpf(t.cpf) },
    { header: "E-mail", cell: (t) => t.email || "—" },
    { header: "Área", cell: (t) => t.expertise_area || "—" },
    { header: "Carga horária", cell: (t) => (t.workload != null ? `${t.workload}h` : "—") },
    { header: "Status", cell: (t) => <TeacherStatusBadge status={t.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Professores"
        description="Cadastro de professores e vínculos com disciplinas e turmas."
        action={
          canManage ? (
            <Link href="/dashboard/professores/novo">
              <Button>
                <Plus className="h-4 w-4" /> Novo professor
              </Button>
            </Link>
          ) : undefined
        }
      />
      <TeacherFilters />
      <p className="mb-3 text-sm text-slate-500">
        {teachers.length} professor(es) encontrado(s)
      </p>
      <DataTable
        columns={columns}
        data={teachers}
        getRowKey={(t) => t.id}
        emptyIcon={Presentation}
        emptyTitle="Nenhum professor encontrado"
        emptyDescription="Ajuste os filtros ou cadastre um novo professor."
      />
    </>
  );
}
