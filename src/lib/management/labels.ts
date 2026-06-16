export const GOAL_STATUS_LABELS = {
  not_started: "Nao iniciada",
  in_progress: "Em andamento",
  on_track: "Dentro do previsto",
  late: "Atrasada",
  completed: "Concluida",
  cancelled: "Cancelada",
} as const;

export const REVIEW_STATUS_LABELS = {
  on_track: "Dentro do previsto",
  attention: "Atencao",
  late: "Atrasado",
  critical: "Critico",
  completed: "Concluido",
} as const;

export const REVIEW_STATUS_BADGE = {
  on_track: "bg-emerald-100 text-emerald-800",
  attention: "bg-amber-100 text-amber-800",
  late: "bg-orange-100 text-orange-800",
  critical: "bg-rose-100 text-rose-800",
  completed: "bg-sky-100 text-sky-800",
} as const;

export const GOAL_STATUS_OPTIONS = Object.entries(GOAL_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const REVIEW_STATUS_OPTIONS = Object.entries(REVIEW_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

