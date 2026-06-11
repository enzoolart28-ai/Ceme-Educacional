import type { StudentStatus } from "@/types/models";

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  defaulter: "Inadimplente",
  locked: "Trancado",
  transferred: "Transferido",
  completed: "Concluído",
  dropout: "Desistente",
};

export const STUDENT_STATUS_BADGE: Record<StudentStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-700",
  defaulter: "bg-rose-100 text-rose-800",
  locked: "bg-amber-100 text-amber-800",
  transferred: "bg-sky-100 text-sky-800",
  completed: "bg-indigo-100 text-indigo-800",
  dropout: "bg-orange-100 text-orange-800",
};

export const STUDENT_STATUS_OPTIONS: { value: StudentStatus; label: string }[] = (
  Object.keys(STUDENT_STATUS_LABELS) as StudentStatus[]
).map((value) => ({ value, label: STUDENT_STATUS_LABELS[value] }));

export function studentStatusLabel(status: StudentStatus): string {
  return STUDENT_STATUS_LABELS[status] ?? status;
}
