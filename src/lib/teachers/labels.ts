import type { TeacherStatus } from "@/types/models";

export const TEACHER_STATUS_LABELS: Record<TeacherStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  on_leave: "Afastado",
  dismissed: "Desligado",
};

export const TEACHER_STATUS_BADGE: Record<TeacherStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-700",
  on_leave: "bg-amber-100 text-amber-800",
  dismissed: "bg-rose-100 text-rose-800",
};

export const TEACHER_STATUS_OPTIONS: { value: TeacherStatus; label: string }[] = (
  Object.keys(TEACHER_STATUS_LABELS) as TeacherStatus[]
).map((value) => ({ value, label: TEACHER_STATUS_LABELS[value] }));

export function teacherStatusLabel(status: TeacherStatus): string {
  return TEACHER_STATUS_LABELS[status] ?? status;
}
