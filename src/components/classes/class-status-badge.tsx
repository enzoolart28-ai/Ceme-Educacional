import { Badge } from "@/components/ui/badge";
import { CLASS_STATUS_BADGE, classStatusLabel } from "@/lib/classes/labels";
import type { ClassStatus } from "@/types/models";

export function ClassStatusBadge({ status }: { status: ClassStatus }) {
  return (
    <Badge className={CLASS_STATUS_BADGE[status]}>{classStatusLabel(status)}</Badge>
  );
}
