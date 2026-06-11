import type { ClassShift, EnrollmentStatus } from "@/types/models";

export const SHIFT_LABELS: Record<ClassShift, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  integral: "Integral",
  sabado: "Sábado",
};

export const SHIFT_OPTIONS: { value: ClassShift; label: string }[] = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
  { value: "integral", label: "Integral" },
  { value: "sabado", label: "Sábado" },
];

export function shiftLabel(shift: ClassShift): string {
  return SHIFT_LABELS[shift] ?? shift;
}

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: "Matriculado",
  transferred: "Transferido",
  cancelled: "Cancelado",
  completed: "Concluído",
};

export const ENROLLMENT_STATUS_BADGE: Record<EnrollmentStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  transferred: "bg-sky-100 text-sky-800",
  cancelled: "bg-slate-200 text-slate-700",
  completed: "bg-indigo-100 text-indigo-800",
};

export function enrollmentStatusLabel(status: EnrollmentStatus): string {
  return ENROLLMENT_STATUS_LABELS[status] ?? status;
}
