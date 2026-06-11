import { Badge } from "@/components/ui/badge";
import { TEACHER_STATUS_BADGE, teacherStatusLabel } from "@/lib/teachers/labels";
import type { TeacherStatus } from "@/types/models";

export function TeacherStatusBadge({ status }: { status: TeacherStatus }) {
  return (
    <Badge className={TEACHER_STATUS_BADGE[status]}>
      {teacherStatusLabel(status)}
    </Badge>
  );
}
