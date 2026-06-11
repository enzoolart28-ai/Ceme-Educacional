import { Badge } from "@/components/ui/badge";
import { SUBJECT_STATUS_BADGE, subjectStatusLabel } from "@/lib/subjects/labels";
import type { SubjectStatus } from "@/types/models";

export function SubjectStatusBadge({ status }: { status: SubjectStatus }) {
  return (
    <Badge className={SUBJECT_STATUS_BADGE[status]}>{subjectStatusLabel(status)}</Badge>
  );
}
