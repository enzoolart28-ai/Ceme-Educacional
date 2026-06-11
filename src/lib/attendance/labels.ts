import type {
  AttendanceRecordStatus,
  AttendanceStatus,
} from "@/types/models";

export const RECORD_STATUS_LABELS: Record<AttendanceRecordStatus, string> = {
  present: "Presente",
  absent: "Falta",
  justified_absence: "Falta justificada",
  late: "Atraso",
};

export const RECORD_STATUS_SHORT: Record<AttendanceRecordStatus, string> = {
  present: "P",
  absent: "F",
  justified_absence: "FJ",
  late: "A",
};

export const RECORD_STATUS_BADGE: Record<AttendanceRecordStatus, string> = {
  present: "bg-emerald-100 text-emerald-800",
  absent: "bg-rose-100 text-rose-800",
  justified_absence: "bg-amber-100 text-amber-800",
  late: "bg-sky-100 text-sky-800",
};

/** Cor do botão (estado ativo) na chamada rápida. */
export const RECORD_STATUS_ACTIVE: Record<AttendanceRecordStatus, string> = {
  present: "bg-emerald-600 text-white",
  absent: "bg-rose-600 text-white",
  justified_absence: "bg-amber-500 text-white",
  late: "bg-sky-600 text-white",
};

export const RECORD_STATUS_ORDER: AttendanceRecordStatus[] = [
  "present",
  "absent",
  "justified_absence",
  "late",
];

export const recordStatusLabel = (s: AttendanceRecordStatus) =>
  RECORD_STATUS_LABELS[s] ?? s;

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  open: "Aberta",
  finalized: "Finalizada",
};

export const ATTENDANCE_STATUS_BADGE: Record<AttendanceStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  finalized: "bg-emerald-100 text-emerald-800",
};
