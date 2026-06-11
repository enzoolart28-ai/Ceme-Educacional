import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, CalendarCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getClassById } from "@/lib/classes/queries";
import {
  listClassAttendances,
  getClassAttendanceSubjects,
  type AttendanceSessionRow,
} from "@/lib/attendance/queries";
import { shiftLabel } from "@/lib/academic/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { NewAttendanceForm } from "@/components/attendance/new-attendance-form";
import { AttendanceStatusBadge } from "@/components/attendance/record-status-badge";

export default async function ChamadaTurmaPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const profile = await requirePermission("classes.read");
  const turma = await getClassById(classId);
  if (!turma) notFound();

  const canManage = hasPermission(profile.role, "grades.manage");
  const [sessions, subjects] = await Promise.all([
    listClassAttendances(classId),
    canManage ? getClassAttendanceSubjects(classId) : Promise.resolve([]),
  ]);

  const columns: Column<AttendanceSessionRow>[] = [
    {
      header: "Data",
      cell: (s) => (
        <Link href={`/dashboard/chamada/${classId}/${s.id}`} className="font-medium text-indigo-700 hover:underline">
          {formatDate(s.date)}
        </Link>
      ),
    },
    { header: "Disciplina", cell: (s) => s.subjectName ?? "Geral" },
    { header: "Registros", cell: (s) => s.recordCount },
    { header: "Status", cell: (s) => <AttendanceStatusBadge status={s.status} /> },
  ];

  return (
    <>
      <Link
        href="/dashboard/chamada"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para turmas
      </Link>

      <PageHeader
        title={`Chamada — ${turma.name}`}
        description={`${turma.courseName} · ${shiftLabel(turma.shift)}`}
        action={
          <Link href={`/dashboard/chamada/${classId}/relatorio`}>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4" /> Frequência
            </Button>
          </Link>
        }
      />

      {canManage && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nova chamada</CardTitle>
          </CardHeader>
          <CardContent>
            <NewAttendanceForm classId={classId} subjects={subjects} />
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={sessions}
        getRowKey={(s) => s.id}
        emptyIcon={CalendarCheck}
        emptyTitle="Nenhuma chamada registrada"
        emptyDescription="Crie a primeira chamada desta turma."
      />
    </>
  );
}
