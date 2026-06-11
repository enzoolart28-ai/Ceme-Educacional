import { Badge } from "@/components/ui/badge";
import { STUDENT_STATUS_BADGE, studentStatusLabel } from "@/lib/students/labels";
import type { StudentStatus } from "@/types/models";

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return (
    <Badge className={STUDENT_STATUS_BADGE[status]}>
      {studentStatusLabel(status)}
    </Badge>
  );
}
