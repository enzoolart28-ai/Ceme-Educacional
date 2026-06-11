import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  listClasses,
  listUnits,
  type ClassFilters,
  type ClassListRow,
} from "@/lib/classes/queries";
import { listCourses } from "@/lib/academic/queries";
import { listTeachers } from "@/lib/teachers/queries";
import { shiftLabel } from "@/lib/academic/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { AcademicNav } from "@/components/academic/academic-nav";
import { ClassFilters as ClassFiltersBar } from "@/components/classes/class-filters";
import { ClassStatusBadge } from "@/components/classes/class-status-badge";
import type { ClassShift, ClassStatus } from "@/types/models";

const SHIFTS: ClassShift[] = ["manha", "tarde", "noite", "integral", "sabado"];
const STATUSES: ClassStatus[] = ["open", "in_progress", "finished", "cancelled"];

export default async function TurmasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    courseId?: string;
    teacherId?: string;
    unitId?: string;
    shift?: string;
    status?: string;
  }>;
}) {
  const profile = await requirePermission("classes.read");
  const canCatalog = hasPermission(profile.role, "academic.read");
  const canManage =
    hasPermission(profile.role, "classes.manage") ||
    hasPermission(profile.role, "academic.manage");
  const sp = await searchParams;

  const filters: ClassFilters = {
    q: sp.q,
    courseId: sp.courseId,
    teacherId: sp.teacherId,
    unitId: sp.unitId,
    shift: sp.shift && SHIFTS.includes(sp.shift as ClassShift) ? (sp.shift as ClassShift) : undefined,
    status: sp.status && STATUSES.includes(sp.status as ClassStatus) ? (sp.status as ClassStatus) : undefined,
  };

  const [classes, courses, teachers, units] = await Promise.all([
    listClasses(filters),
    listCourses(),
    listTeachers(),
    listUnits(),
  ]);

  const columns: Column<ClassListRow>[] = [
    {
      header: "Turma",
      cell: (c) => (
        <Link href={`/dashboard/academico/turmas/${c.id}`} className="font-medium text-indigo-700 hover:underline">
          {c.name}
        </Link>
      ),
    },
    { header: "Curso", cell: (c) => c.courseName },
    { header: "Unidade", cell: (c) => c.unitName ?? "—" },
    { header: "Turno", cell: (c) => shiftLabel(c.shift) },
    { header: "Professor", cell: (c) => c.mainTeacherName ?? "—" },
    {
      header: "Alunos",
      cell: (c) => `${c.studentCount}${c.max_students != null ? `/${c.max_students}` : ""}`,
    },
    { header: "Status", cell: (c) => <ClassStatusBadge status={c.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Turmas"
        description="Turmas, horários, professores e alunos."
        action={
          canManage ? (
            <Link href="/dashboard/academico/turmas/novo">
              <Button>
                <Plus className="h-4 w-4" /> Nova turma
              </Button>
            </Link>
          ) : undefined
        }
      />
      <AcademicNav canCatalog={canCatalog} />
      <ClassFiltersBar
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        teachers={teachers.map((t) => ({ id: t.id, name: t.full_name }))}
        units={units.map((u) => ({ id: u.id, name: u.name }))}
      />
      <p className="mb-3 text-sm text-slate-500">{classes.length} turma(s) encontrada(s)</p>
      <DataTable
        columns={columns}
        data={classes}
        getRowKey={(c) => c.id}
        emptyIcon={LayoutGrid}
        emptyTitle="Nenhuma turma encontrada"
        emptyDescription="Ajuste os filtros ou crie uma nova turma."
      />
    </>
  );
}
