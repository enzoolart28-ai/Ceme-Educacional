import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Users,
  GraduationCap,
  CalendarCheck,
  ClipboardCheck,
} from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getClassById, listRoster, type RosterRow } from "@/lib/classes/queries";
import { listStudents } from "@/lib/students/queries";
import {
  listAssignments,
  listTeachers as listTeacherProfiles,
  listSubjects,
  type AssignmentRow,
} from "@/lib/academic/queries";
import { shiftLabel } from "@/lib/academic/labels";
import { formatWeekdays, formatTime } from "@/lib/classes/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ClassStatusBadge } from "@/components/classes/class-status-badge";
import { ClassRosterForm } from "@/components/classes/class-roster-form";
import { ClassRosterRemoveButton } from "@/components/classes/class-roster-remove-button";
import { ClassDeleteButton } from "@/components/classes/class-delete-button";
import { AssignTeacherForm } from "@/components/academic/assign-teacher-form";
import { RemoveButton } from "@/components/academic/remove-button";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

export default async function TurmaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requirePermission("classes.read");
  const turma = await getClassById(id);
  if (!turma) notFound();

  const canManage =
    hasPermission(profile.role, "classes.manage") ||
    hasPermission(profile.role, "academic.manage");

  const [roster, assignments] = await Promise.all([listRoster(id), listAssignments(id)]);
  const [students, teacherProfiles, subjects] = canManage
    ? await Promise.all([listStudents(), listTeacherProfiles(), listSubjects()])
    : [[], [], []];

  const horario =
    turma.start_time && turma.end_time
      ? `${formatTime(turma.start_time)} – ${formatTime(turma.end_time)}`
      : "—";

  const rosterColumns: Column<RosterRow>[] = [
    {
      header: "Aluno",
      cell: (r) =>
        r.student ? (
          <Link href={`/dashboard/alunos/${r.student.id}`} className="font-medium text-indigo-700 hover:underline">
            {r.student.full_name}
          </Link>
        ) : (
          "—"
        ),
    },
    ...(canManage
      ? [
          {
            header: "",
            cell: (r: RosterRow) => <ClassRosterRemoveButton id={r.id} classId={id} />,
          },
        ]
      : []),
  ];

  const assignmentColumns: Column<AssignmentRow>[] = [
    { header: "Professor", cell: (a) => a.teacher?.full_name ?? "—" },
    { header: "Disciplina", cell: (a) => a.subjectName ?? "—" },
    ...(canManage
      ? [
          {
            header: "",
            cell: (a: AssignmentRow) => <RemoveButton id={a.id} classId={id} kind="assignment" />,
          },
        ]
      : []),
  ];

  return (
    <>
      <Link
        href="/dashboard/academico/turmas"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para turmas
      </Link>

      <PageHeader
        title={turma.name}
        description={`${turma.courseName} · ${shiftLabel(turma.shift)}`}
        action={
          <div className="flex items-center gap-2">
            <ClassStatusBadge status={turma.status} />
            {canManage && (
              <>
                <Link href={`/dashboard/academico/turmas/${id}/editar`}>
                  <Button variant="outline">
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                </Link>
                <ClassDeleteButton classId={id} />
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dados da turma</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Curso" value={turma.courseName} />
            <Row label="Unidade/polo" value={turma.unitName} />
            <Row label="Turno" value={shiftLabel(turma.shift)} />
            <Row label="Ano letivo" value={turma.year} />
            <Row label="Início" value={formatDate(turma.start_date)} />
            <Row label="Término" value={formatDate(turma.end_date)} />
            <Row label="Dias" value={formatWeekdays(turma.weekdays)} />
            <Row label="Horário" value={horario} />
            <Row label="Prof. responsável" value={turma.mainTeacherName} />
            <Row
              label="Alunos"
              value={`${turma.studentCount}${turma.max_students != null ? ` / ${turma.max_students}` : ""}`}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4 text-slate-400" /> Alunos matriculados ({turma.studentCount})
            </h2>
            {canManage && (
              <Card>
                <CardContent>
                  <ClassRosterForm
                    classId={id}
                    students={students.map((s) => ({ id: s.id, full_name: s.full_name }))}
                  />
                </CardContent>
              </Card>
            )}
            <DataTable
              columns={rosterColumns}
              data={roster}
              getRowKey={(r) => r.id}
              emptyIcon={Users}
              emptyTitle="Nenhum aluno na turma"
              emptyDescription="Vincule alunos a esta turma."
            />
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <GraduationCap className="h-4 w-4 text-slate-400" /> Professores (disciplinas)
            </h2>
            {canManage && (
              <Card>
                <CardContent>
                  <AssignTeacherForm
                    classId={id}
                    teachers={teacherProfiles}
                    subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
                  />
                </CardContent>
              </Card>
            )}
            <DataTable
              columns={assignmentColumns}
              data={assignments}
              getRowKey={(a) => a.id}
              emptyIcon={GraduationCap}
              emptyTitle="Nenhum professor vinculado"
              emptyDescription="Vincule professores e disciplinas a esta turma."
            />
          </section>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card className="p-6">
              <EmptyState
                icon={CalendarCheck}
                title="Frequência da turma"
                description="Disponível quando o módulo de Frequência for implementado."
              />
            </Card>
            <Card className="p-6">
              <EmptyState
                icon={ClipboardCheck}
                title="Notas da turma"
                description="Disponível quando o módulo de Notas for implementado."
              />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
