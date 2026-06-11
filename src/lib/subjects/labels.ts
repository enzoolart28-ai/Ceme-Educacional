import type { SubjectStatus } from "@/types/models";

export const SUBJECT_STATUS_LABELS: Record<SubjectStatus, string> = {
  active: "Ativa",
  inactive: "Inativa",
};

export const SUBJECT_STATUS_BADGE: Record<SubjectStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-700",
};

export const SUBJECT_STATUS_OPTIONS = (
  Object.keys(SUBJECT_STATUS_LABELS) as SubjectStatus[]
).map((value) => ({ value, label: SUBJECT_STATUS_LABELS[value] }));

export const subjectStatusLabel = (s: SubjectStatus) => SUBJECT_STATUS_LABELS[s] ?? s;
