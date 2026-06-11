import { Badge } from "@/components/ui/badge";
import {
  SITUATION_BADGE,
  situationLabel,
  assessmentTypeLabel,
  type SituationStatus,
} from "@/lib/grades/labels";
import type { AssessmentType } from "@/types/models";

export function SituationBadge({ situation }: { situation: SituationStatus }) {
  return <Badge className={SITUATION_BADGE[situation]}>{situationLabel(situation)}</Badge>;
}

export function AssessmentTypeBadge({ type }: { type: AssessmentType }) {
  return (
    <Badge className="bg-slate-100 text-slate-700">{assessmentTypeLabel(type)}</Badge>
  );
}
