import type { CourseModality, CourseStatus, CourseType } from "@/types/models";

export const MODALITY_LABELS: Record<CourseModality, string> = {
  presencial: "Presencial",
  semipresencial: "Semipresencial",
  ead: "EAD",
};

export const TYPE_LABELS: Record<CourseType, string> = {
  tecnico: "Técnico",
  profissionalizante: "Profissionalizante",
  livre: "Livre",
  infantil: "Infantil",
  preparatorio: "Preparatório",
  reforco: "Reforço escolar",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  planning: "Em planejamento",
  closed: "Encerrado",
};

export const COURSE_STATUS_BADGE: Record<CourseStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-700",
  planning: "bg-amber-100 text-amber-800",
  closed: "bg-rose-100 text-rose-800",
};

export const MODALITY_OPTIONS = (Object.keys(MODALITY_LABELS) as CourseModality[]).map(
  (value) => ({ value, label: MODALITY_LABELS[value] }),
);
export const TYPE_OPTIONS = (Object.keys(TYPE_LABELS) as CourseType[]).map((value) => ({
  value,
  label: TYPE_LABELS[value],
}));
export const COURSE_STATUS_OPTIONS = (
  Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]
).map((value) => ({ value, label: COURSE_STATUS_LABELS[value] }));

export const modalityLabel = (m: CourseModality) => MODALITY_LABELS[m] ?? m;
export const typeLabel = (t: CourseType) => TYPE_LABELS[t] ?? t;
export const courseStatusLabel = (s: CourseStatus) => COURSE_STATUS_LABELS[s] ?? s;
