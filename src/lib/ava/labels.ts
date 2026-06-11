import type {
  LessonReleaseType,
  LessonStatus,
  MaterialType,
  LessonProgressStatus,
} from "@/types/models";

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  draft: "Rascunho",
  published: "Publicada",
  archived: "Arquivada",
};

export const LESSON_STATUS_BADGE: Record<LessonStatus, string> = {
  draft: "bg-slate-200 text-slate-700",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-amber-100 text-amber-800",
};

export const LESSON_STATUS_OPTIONS = (
  Object.keys(LESSON_STATUS_LABELS) as LessonStatus[]
).map((value) => ({ value, label: LESSON_STATUS_LABELS[value] }));

export const RELEASE_TYPE_LABELS: Record<LessonReleaseType, string> = {
  all: "Liberada para todos",
  date: "Liberar por data",
  after_previous: "Após concluir a aula anterior",
};

export const RELEASE_TYPE_OPTIONS = (
  Object.keys(RELEASE_TYPE_LABELS) as LessonReleaseType[]
).map((value) => ({ value, label: RELEASE_TYPE_LABELS[value] }));

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  video: "Vídeo",
  pdf: "PDF",
  slides: "Slides",
  link: "Link externo",
  file: "Arquivo",
};

export const MATERIAL_TYPE_OPTIONS = (
  Object.keys(MATERIAL_TYPE_LABELS) as MaterialType[]
).map((value) => ({ value, label: MATERIAL_TYPE_LABELS[value] }));

export const PROGRESS_STATUS_LABELS: Record<LessonProgressStatus, string> = {
  not_started: "Não iniciada",
  in_progress: "Em andamento",
  completed: "Concluída",
};

export const lessonStatusLabel = (s: LessonStatus) => LESSON_STATUS_LABELS[s] ?? s;
export const releaseTypeLabel = (r: LessonReleaseType) => RELEASE_TYPE_LABELS[r] ?? r;
export const materialTypeLabel = (m: MaterialType) => MATERIAL_TYPE_LABELS[m] ?? m;
