import type { EventStatus } from "@/types/models";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  planejado: "Planejado",
  aberto_inscricao: "Aberto para inscrição",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
};

export const EVENT_STATUS_BADGE: Record<EventStatus, string> = {
  planejado: "bg-slate-200 text-slate-700",
  aberto_inscricao: "bg-emerald-100 text-emerald-800",
  encerrado: "bg-amber-100 text-amber-800",
  cancelado: "bg-rose-100 text-rose-800",
  finalizado: "bg-indigo-100 text-indigo-800",
};

export const EVENT_STATUS_OPTIONS = (
  Object.keys(EVENT_STATUS_LABELS) as EventStatus[]
).map((value) => ({ value, label: EVENT_STATUS_LABELS[value] }));

export const eventStatusLabel = (s: EventStatus) => EVENT_STATUS_LABELS[s] ?? s;
