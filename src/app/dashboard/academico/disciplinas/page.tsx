import Link from "next/link";
import { Library, Plus, Pencil } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listSubjects } from "@/lib/subjects/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { AcademicNav } from "@/components/academic/academic-nav";
import { SubjectStatusBadge } from "@/components/subjects/subject-status-badge";
import { SubjectDeleteButton } from "@/components/subjects/subject-delete-button";
import type { Subject } from "@/types/models";

export default async function DisciplinasPage() {
  const profile = await requirePermission("academic.read");
  const canManage =
    hasPermission(profile.role, "academic.manage") ||
    hasPermission(profile.role, "curriculum.manage");
  const subjects = await listSubjects();

  const columns: Column<Subject>[] = [
    { header: "Disciplina", cell: (s) => <span className="font-medium text-slate-900">{s.name}</span> },
    { header: "Código", cell: (s) => s.code || "—" },
    { header: "Carga", cell: (s) => (s.workload_hours != null ? `${s.workload_hours}h` : "—") },
    { header: "Status", cell: (s) => <SubjectStatusBadge status={s.status} /> },
    ...(canManage
      ? [
          {
            header: "",
            cell: (s: Subject) => (
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={`/dashboard/academico/disciplinas/${s.id}/editar`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <SubjectDeleteButton subjectId={s.id} />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Disciplinas"
        description="Catálogo de disciplinas / componentes curriculares."
        action={
          canManage ? (
            <Link href="/dashboard/academico/disciplinas/novo">
              <Button>
                <Plus className="h-4 w-4" /> Nova disciplina
              </Button>
            </Link>
          ) : undefined
        }
      />
      <AcademicNav canCatalog />
      <DataTable
        columns={columns}
        data={subjects}
        getRowKey={(s) => s.id}
        emptyIcon={Library}
        emptyTitle="Nenhuma disciplina"
        emptyDescription="Cadastre a primeira disciplina."
      />
    </>
  );
}
