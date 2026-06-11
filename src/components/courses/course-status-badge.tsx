import { Badge } from "@/components/ui/badge";
import { COURSE_STATUS_BADGE, courseStatusLabel } from "@/lib/courses/labels";
import type { CourseStatus } from "@/types/models";

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return (
    <Badge className={COURSE_STATUS_BADGE[status]}>{courseStatusLabel(status)}</Badge>
  );
}
