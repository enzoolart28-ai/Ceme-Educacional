import { Badge } from "@/components/ui/badge";
import {
  RECORD_STATUS_BADGE,
  recordStatusLabel,
  ATTENDANCE_STATUS_BADGE,
  ATTENDANCE_STATUS_LABELS,
} from "@/lib/attendance/labels";
import type { AttendanceRecordStatus, AttendanceStatus } from "@/types/models";

export function RecordStatusBadge({ status }: { status: AttendanceRecordStatus }) {
  return <Badge className={RECORD_STATUS_BADGE[status]}>{recordStatusLabel(status)}</Badge>;
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <Badge className={ATTENDANCE_STATUS_BADGE[status]}>
      {ATTENDANCE_STATUS_LABELS[status]}
    </Badge>
  );
}
