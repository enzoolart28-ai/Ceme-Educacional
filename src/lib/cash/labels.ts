export const CASH_SESSION_STATUS_LABELS = {
  open: "Aberto",
  closed: "Fechado",
  under_review: "Em conferencia",
  with_difference: "Com divergencia",
  approved: "Aprovado",
  rejected: "Reprovado",
} as const;

export const CASH_MOVEMENT_TYPE_LABELS = {
  entry: "Entrada",
  exit: "Saida",
  reinforcement: "Reforco",
  withdrawal: "Sangria",
  reversal: "Estorno",
  adjustment: "Ajuste autorizado",
} as const;

export const CASH_MOVEMENT_STATUS_LABELS = {
  pending: "Pendente",
  completed: "Concluida",
  cancelled: "Cancelada",
  reversed: "Estornada",
} as const;

export const CASH_STATUS_BADGE = {
  open: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-100 text-slate-700",
  under_review: "bg-amber-100 text-amber-800",
  with_difference: "bg-rose-100 text-rose-800",
  approved: "bg-sky-100 text-sky-800",
  rejected: "bg-red-100 text-red-800",
} as const;

export const CASH_MOVEMENT_TYPE_OPTIONS = Object.entries(CASH_MOVEMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const CASH_SESSION_STATUS_OPTIONS = Object.entries(CASH_SESSION_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

