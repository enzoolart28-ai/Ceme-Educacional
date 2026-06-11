import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getAttendanceById, getAttendanceRoster } from "@/lib/attendance/queries";
import { formatDate } from "@/lib/utils";
import { formatTime } from "@/lib/classes/labels";
import { PageHeader } from "@/components/ui/page-header";
import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import { AttendanceStatusBadge } from "@/components/attendance/record-status-badge";
import { AttendanceDeleteButton } from "@/components/attendance/attendance-delete-button";

export default async function ChamadaRapidaPage({
  params,
}: {
  params: Promise<{ classId: string; attendanceId: string }>;
}) {
  const { classId, attendanceId } = await params;
  const profile = await requirePermission("classes.read");

  const attendance = await getAttendanceById(attendanceId);
  if (!attendance || attendance.class_id !== classId) notFound();

  const canManage = hasPermission(profile.role, "grades.manage");
  const roster = await getAttendanceRoster(attendanceId, classId);

  const horario =
    attendance.start_time && attendance.end_time
      ? ` · ${formatTime(attendance.start_time)}–${formatTime(attendance.end_time)}`
      : "";

  return (
    <>
      <Link
        href={`/dashboard/chamada/${classId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para a turma
      </Link>

      <PageHeader
        title={`Chamada — ${formatDate(attendance.date)}`}
        description={`${attendance.className} · ${attendance.subjectName ?? "Geral"}${horario}`}
        action={
          <div className="flex items-center gap-2">
            <AttendanceStatusBadge status={attendance.status} />
            {canManage && <AttendanceDeleteButton id={attendanceId} classId={classId} />}
          </div>
        }
      />

      <AttendanceSheet
        attendanceId={attendanceId}
        classId={classId}
        roster={roster}
        canManage={canManage}
      />
    </>
  );
}
