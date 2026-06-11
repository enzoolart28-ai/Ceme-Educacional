import type { ClassStatus } from "@/types/models";

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  finished: "Finalizada",
  cancelled: "Cancelada",
};

export const CLASS_STATUS_BADGE: Record<ClassStatus, string> = {
  open: "bg-sky-100 text-sky-800",
  in_progress: "bg-emerald-100 text-emerald-800",
  finished: "bg-indigo-100 text-indigo-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export const CLASS_STATUS_OPTIONS = (
  Object.keys(CLASS_STATUS_LABELS) as ClassStatus[]
).map((value) => ({ value, label: CLASS_STATUS_LABELS[value] }));

export const classStatusLabel = (s: ClassStatus) => CLASS_STATUS_LABELS[s] ?? s;

// Dias da semana (armazenados como text[] em classes.weekdays).
export const WEEKDAYS: { value: string; label: string; short: string }[] = [
  { value: "dom", label: "Domingo", short: "Dom" },
  { value: "seg", label: "Segunda", short: "Seg" },
  { value: "ter", label: "Terça", short: "Ter" },
  { value: "qua", label: "Quarta", short: "Qua" },
  { value: "qui", label: "Quinta", short: "Qui" },
  { value: "sex", label: "Sexta", short: "Sex" },
  { value: "sab", label: "Sábado", short: "Sáb" },
];

const WEEKDAY_SHORT = new Map(WEEKDAYS.map((d) => [d.value, d.short]));

/** Formata um array de dias (ex.: ["seg","qua"]) como "Seg, Qua". */
export function formatWeekdays(days: string[] | null | undefined): string {
  if (!days || days.length === 0) return "—";
  return days
    .map((d) => WEEKDAY_SHORT.get(d) ?? d)
    .join(", ");
}

/** Formata um horário "HH:MM:SS" → "HH:MM". */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 5);
}
