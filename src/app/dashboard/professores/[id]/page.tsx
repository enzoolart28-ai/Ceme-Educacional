import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Library, LayoutGrid, History } from "lucide-react";
import { requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getTeacherById,
  getTeacherSubjects,
  getTeacherClasses,
  getTeacherHistory,
  type TeacherSubjectRow,
  type TeacherClassRow,
  type TeacherHistoryRow,
} from "@/lib/teachers/queries";
import { listSubjects, listClasses } from "@/lib/academic/queries";
import { formatCpf } from "@/lib/students/cpf";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { TeacherStatusBadge } from "@/components/teachers/teacher-status-badge";
import { TeacherLinkForm } from "@/components/teachers/teacher-link-form";
import { TeacherUnlinkButton } from "@/components/teachers/teacher-unlink-button";
import { TeacherDeleteButton } from "@/components/teachers/teacher-delete-button";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

export default async function ProfessorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole(STAFF_ROLES);
  const teacher = await getTeacherById(id);
  if (!teacher) notFound();

  const canManage = hasPermission(profile.role, "teachers.manage");

  const [subjects, classes, history] = await Promise.all([
    getTeacherSubjects(id),
    getTeacherClasses(id),
    teacher.profile_id ? getTeacherHistory(teacher.profile_id) : Promise.resolve([]),
  ]);
  const [allSubjects, allClasses] = canManage
    ? await Promise.all([listSubjects(), listClasses()])
    : [[], []];

  const subjectColumns: Column<TeacherSubjectRow>[] = [
    { header: "Disciplina", cell: (s) => s.subject?.name ?? "—" },
    ...(canManage
      ? [
          {
            header: "",
            cell: (s: TeacherSubjectRow) => (
              <TeacherUnlinkButton id={s.id} teacherId={id} kind="subject" />
            ),
          },
        ]
      : []),
  ];

  const classColumns: Column<TeacherClassRow>[] = [
    {
      header: "Turma",
      cell: (c) => (c.class ? `${c.class.name} (${c.class.year})` : "—"),
    },
    ...(canManage
      ? [
          {
            header: "",
            cell: (c: TeacherClassRow) => (
              <TeacherUnlinkButton id={c.id} teacherId={id} kind="class" />
            ),
          },
        ]
      : []),
  ];

  const historyColumns: Column<TeacherHistoryRow>[] = [
    { header: "Turma", cell: (h) => h.className },
    { header: "Disciplina", cell: (h) => h.subjectName },
  ];

  return (
    <>
      <Link
        href="/dashboard/professores"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para professores
      </Link>

      <PageHeader
        title={teacher.full_name}
        description={teacher.expertise_area ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <TeacherStatusBadge status={teacher.status} />
            {canManage && (
              <>
                <Link href={`/dashboard/professores/${id}/editar`}>
                  <Button variant="outline">
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                </Link>
                <TeacherDeleteButton teacherId={id} />
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="CPF" value={formatCpf(teacher.cpf)} />
            <Row label="RG" value={teacher.rg} />
            <Row label="Telefone" value={teacher.phone} />
            <Row label="E-mail" value={teacher.email} />
            <Row label="Formação" value={teacher.education} />
            <Row label="Área de atuação" value={teacher.expertise_area} />
            <Row
              label="Carga horária"
              value={teacher.workload != null ? `${teacher.workload}h/semana` : "—"}
            />
            <Row label="Acesso ao painel" value={teacher.profile_id ? "Sim" : "Não"} />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Library className="h-4 w-4 text-slate-400" /> Disciplinas
            </h2>
            {canManage && (
              <Card>
                <CardContent>
                  <TeacherLinkForm
                    teacherId={id}
                    kind="subject"
                    options={allSubjects.map((s) => ({ id: s.id, label: s.name }))}
                  />
                </CardContent>
              </Card>
            )}
            <DataTable
              columns={subjectColumns}
              data={subjects}
              getRowKey={(s) => s.id}
              emptyIcon={Library}
              emptyTitle="Nenhuma disciplina"
              emptyDescription="Vincule disciplinas a este professor."
            />
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <LayoutGrid className="h-4 w-4 text-slate-400" /> Turmas vinculadas
            </h2>
            {canManage && (
              <Card>
                <CardContent>
                  <TeacherLinkForm
                    teacherId={id}
                    kind="class"
                    options={allClasses.map((c) => ({
                      id: c.id,
                      label: `${c.name} (${c.year})`,
                    }))}
                  />
                </CardContent>
              </Card>
            )}
            <DataTable
              columns={classColumns}
              data={classes}
              getRowKey={(c) => c.id}
              emptyIcon={LayoutGrid}
              emptyTitle="Nenhuma turma vinculada"
              emptyDescription="Vincule turmas a este professor."
            />
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <History className="h-4 w-4 text-slate-400" /> Histórico de atuação
            </h2>
            <DataTable
              columns={historyColumns}
              data={history}
              getRowKey={(h) => h.id}
              emptyIcon={History}
              emptyTitle="Sem atuação registrada"
              emptyDescription="As atribuições de disciplina × turma (módulo Acadêmico) aparecem aqui."
            />
          </section>
        </div>
      </div>
    </>
  );
}
