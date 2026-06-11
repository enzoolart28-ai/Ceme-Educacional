import { Badge } from "@/components/ui/badge";
import { DOCUMENT_STATUS_BADGE, documentStatusLabel } from "@/lib/documents/labels";
import type { DocumentStatus } from "@/types/models";

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge className={DOCUMENT_STATUS_BADGE[status]}>{documentStatusLabel(status)}</Badge>;
}
