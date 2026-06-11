import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Library, ListOrdered } from "lucide-react";
import { requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getCourseById,
  getCourseSubjects,
  getCourseModules,
  type CourseSubjectRow,
} from "@/lib/courses/queries";
import { listSubjects } from "@/lib/subjects/queries";
import { listTeachers } from "@/lib/teachers/queries";
import { modalityLabel, typeLabel } from "@/lib/courses/labels";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { CourseStatusBadge } from "@/components/courses/course-status-badge";
import { CourseDisciplineForm } from "@/components/courses/course-discipline-form";
import { CourseModuleForm } from "@/components/courses/course-module-form";
import { CourseRemoveButton } from "@/components/courses/course-remove-button";
import { CourseReorderButtons } from "@/components/courses/course-reorder-button";
import type { CourseModule } from "@/types/models";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

export default async function CursoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole(STAFF_ROLES);
  const course = await getCourseById(id);
  if (!course) notFound();

  const canManage = hasPermission(profile.role, "courses.manage");

  const [disciplines, modules] = await Promise.all([
    getCourseSubjects(id),
    getCourseModules(id),
  ]);
  const [allSubjects, allTeachers] = canManage
    ? await Promise.all([listSubjects(), listTeachers()])
    : [[], []];

  const moduleName = new Map(modules.map((m) => [m.id, m.name]));

  const moduleColumns: Column<CourseModule>[] = [
    ...(canManage
      ? [
          {
            header: "",
            cell: (m: CourseModule) => (
              <CourseReorderButtons id={m.id} courseId={id} kind="module" />
            ),
            className: "w-10",
          },
        ]
      : []),
    { header: "Módulo", cell: (m) => <span className="font-medium text-slate-900">{m.name}</span> },
    { header: "Descrição", cell: (m) => m.description || "—" },
    { header: "Carga", cell: (m) => (m.workload_hours != null ? `${m.workload_hours}h` : "—") },
    ...(canManage
      ? [
          {
            header: "",
            cell: (m: CourseModule) => <CourseRemoveButton id={m.id} courseId={id} kind="module" />,
          },
        ]
      : []),
  ];

  const disciplineColumns: Column<CourseSubjectRow>[] = [
    ...(canManage
      ? [
          {
            header: "",
            cell: (d: CourseSubjectRow) => (
              <CourseReorderButtons id={d.id} courseId={id} kind="subject" />
            ),
            className: "w-10",
          },
        ]
      : []),
    { header: "Disciplina", cell: (d) => d.subject?.name ?? "—" },
    { header: "Módulo", cell: (d) => (d.module_id ? moduleName.get(d.module_id) ?? "—" : "—") },
    { header: "Carga", cell: (d) => (d.workload_hours != null ? `${d.workload_hours}h` : "—") },
    { header: "Professor", cell: (d) => d.teacher?.full_name ?? "—" },
    ...(canManage
      ? [
          {
            header: "",
            cell: (d: CourseSubjectRow) => (
              <CourseRemoveButton id={d.id} courseId={id} kind="subject" />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Link
        href="/dashboard/academico/cursos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para cursos
      </Link>

      <PageHeader
        title={course.name}
        description={`${modalityLabel(course.modality)} · ${typeLabel(course.type)}`}
        action={
          <div className="flex items-center gap-2">
            <CourseStatusBadge status={course.status} />
            {canManage && (
              <Link href={`/dashboard/academico/cursos/${id}/editar`}>
                <Button variant="outline">
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dados do curso</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Modalidade" value={modalityLabel(course.modality)} />
            <Row label="Tipo" value={typeLabel(course.type)} />
            <Row label="Carga horária" value={course.workload_hours != null ? `${course.workload_hours}h` : "—"} />
            <Row label="Duração" value={course.duration} />
            <Row label="Valor" value={course.price != null ? formatCurrency(course.price) : "—"} />
            <Row label="Certificado" value={course.certificate_enabled ? "Sim" : "Não"} />
            <Row label="Frequência mínima" value={course.minimum_attendance != null ? `${course.minimum_attendance}%` : "—"} />
            <Row label="Média mínima" value={course.minimum_grade != null ? String(course.minimum_grade) : "—"} />
            <Row label="Requisitos" value={course.requirements} />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <ListOrdered className="h-4 w-4 text-slate-400" /> Módulos
              </h2>
              {canManage && <CourseModuleForm courseId={id} />}
            </div>
            <DataTable
              columns={moduleColumns}
              data={modules}
              getRowKey={(m) => m.id}
              emptyIcon={ListOrdered}
              emptyTitle="Nenhum módulo"
              emptyDescription="Defina os módulos do curso."
            />
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Library className="h-4 w-4 text-slate-400" /> Disciplinas (componentes curriculares)
            </h2>
            {canManage && (
              <Card>
                <CardContent>
                  <CourseDisciplineForm
                    courseId={id}
                    subjects={allSubjects.map((s) => ({ id: s.id, name: s.name }))}
                    modules={modules.map((m) => ({ id: m.id, name: m.name }))}
                    teachers={allTeachers.map((t) => ({ id: t.id, name: t.full_name }))}
                  />
                </CardContent>
              </Card>
            )}
            <DataTable
              columns={disciplineColumns}
              data={disciplines}
              getRowKey={(d) => d.id}
              emptyIcon={Library}
              emptyTitle="Nenhuma disciplina"
              emptyDescription="Adicione disciplinas (opcionalmente em módulos) ao curso."
            />
          </section>
        </div>
      </div>
    </>
  );
}
