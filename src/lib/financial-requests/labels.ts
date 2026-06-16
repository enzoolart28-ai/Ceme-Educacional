export const FINANCIAL_REQUEST_STATUS_LABELS = {
  draft: "Rascunho",
  submitted: "Enviada",
  under_review: "Em analise",
  approved: "Aprovada",
  partially_approved: "Aprovada parcialmente",
  rejected: "Recusada",
  needs_information: "Aguardando informacao",
  paid: "Paga",
  cancelled: "Cancelada",
} as const;

export const FINANCIAL_REQUEST_PRIORITY_LABELS = {
  baixa: "Baixa",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
} as const;

export const FINANCIAL_REQUEST_STATUS_BADGE = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-indigo-100 text-indigo-800",
  under_review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  partially_approved: "bg-sky-100 text-sky-800",
  rejected: "bg-red-100 text-red-800",
  needs_information: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-slate-200 text-slate-600",
} as const;

export const FINANCIAL_REQUEST_PRIORITY_BADGE = {
  baixa: "bg-slate-100 text-slate-700",
  media: "bg-sky-100 text-sky-800",
  alta: "bg-amber-100 text-amber-800",
  urgente: "bg-rose-100 text-rose-800",
} as const;

export const FINANCIAL_REQUEST_STATUS_OPTIONS = Object.entries(
  FINANCIAL_REQUEST_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

export const FINANCIAL_REQUEST_PRIORITY_OPTIONS = Object.entries(
  FINANCIAL_REQUEST_PRIORITY_LABELS,
).map(([value, label]) => ({ value, label }));

