import { Badge } from "@/components/ui/badge";
import { LESSON_STATUS_BADGE, lessonStatusLabel } from "@/lib/ava/labels";
import type { LessonStatus } from "@/types/models";

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  return <Badge className={LESSON_STATUS_BADGE[status]}>{lessonStatusLabel(status)}</Badge>;
}
