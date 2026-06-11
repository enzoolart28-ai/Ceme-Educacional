import { Badge } from "@/components/ui/badge";
import {
  ASSESSMENT_STATUS_BADGE,
  assessmentStatusLabel,
  SUBMISSION_STATUS_BADGE,
  submissionStatusLabel,
  QUESTION_TYPE_LABELS,
} from "@/lib/online-assessments/labels";
import type {
  OnlineAssessmentStatus,
  SubmissionStatus,
  QuestionType,
} from "@/types/models";

export function AssessmentStatusBadge({ status }: { status: OnlineAssessmentStatus }) {
  return <Badge className={ASSESSMENT_STATUS_BADGE[status]}>{assessmentStatusLabel(status)}</Badge>;
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge className={SUBMISSION_STATUS_BADGE[status]}>{submissionStatusLabel(status)}</Badge>;
}

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  return <Badge className="bg-indigo-50 text-indigo-700">{QUESTION_TYPE_LABELS[type] ?? type}</Badge>;
}
