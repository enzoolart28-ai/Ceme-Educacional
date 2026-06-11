import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listCourses, type CourseFilters } from "@/lib/courses/queries";
import {
  modalityLabel,
  typeLabel,
  MODALITY_LABELS,
  TYPE_LABELS,
  COURSE_STATUS_LABELS,
} from "@/lib/courses/labels";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { AcademicNav } from "@/components/academic/academic-nav";
import { CourseFilters as CourseFiltersBar } from "@/components/courses/course-filters";
import { CourseStatusBadge } from "@/components/courses/course-status-badge";
import type { Course, CourseModality, CourseStatus, CourseType } from "@/types/models";

function pick<T extends string>(value: string | undefined, valid: Record<T, unknown>): T | undefined {
  return value && value in valid ? (value as T) : undefined;
}

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; modality?: string; type?: string; status?: string }>;
}) {
  const profile = await requireRole(STAFF_ROLES);
  const canManage = hasPermission(profile.role, "courses.manage");
  const canCatalog = hasPermission(profile.role, "academic.read");
  const sp = await searchParams;

  const filters: CourseFilters = {
    q: sp.q,
    modality: pick<CourseModality>(sp.modality, MODALITY_LABELS),
    type: pick<CourseType>(sp.type, TYPE_LABELS),
    status: pick<CourseStatus>(sp.status, COURSE_STATUS_LABELS),
  };
  const courses = await listCourses(filters);

  const columns: Column<Course>[] = [
    {
      header: "Curso",
      cell: (c) => (
        <Link
          href={`/dashboard/academico/cursos/${c.id}`}
          className="font-medium text-indigo-700 hover:underline"
        >
          {c.name}
        </Link>
      ),
    },
    { header: "Modalidade", cell: (c) => modalityLabel(c.modality) },
    { header: "Tipo", cell: (c) => typeLabel(c.type) },
    { header: "Carga", cell: (c) => (c.workload_hours != null ? `${c.workload_hours}h` : "—") },
    { header: "Valor", cell: (c) => (c.price != null ? formatCurrency(c.price) : "—") },
    { header: "Status", cell: (c) => <CourseStatusBadge status={c.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Cadastro e gestão de cursos."
        action={
          canManage ? (
            <Link href="/dashboard/academico/cursos/novo">
              <Button>
                <Plus className="h-4 w-4" /> Novo curso
              </Button>
            </Link>
          ) : undefined
        }
      />
      <AcademicNav canCatalog={canCatalog} />
      <CourseFiltersBar />
      <p className="mb-3 text-sm text-slate-500">{courses.length} curso(s) encontrado(s)</p>
      <DataTable
        columns={columns}
        data={courses}
        getRowKey={(c) => c.id}
        emptyIcon={BookOpen}
        emptyTitle="Nenhum curso encontrado"
        emptyDescription="Ajuste os filtros ou cadastre um novo curso."
      />
    </>
  );
}
