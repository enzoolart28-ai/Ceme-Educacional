import type { CalendarEventType, EventVisibility } from "@/types/models";

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  aula: "Aula",
  prova: "Prova",
  atividade: "Atividade",
  reuniao: "Reunião",
  feriado: "Feriado",
  institucional: "Evento institucional",
  vencimento_financeiro: "Vencimento financeiro",
  palestra: "Palestra",
};

/** Cor de fundo + texto (badges/blocos de evento). */
export const EVENT_TYPE_BADGE: Record<CalendarEventType, string> = {
  aula: "bg-sky-100 text-sky-800",
  prova: "bg-rose-100 text-rose-800",
  atividade: "bg-amber-100 text-amber-800",
  reuniao: "bg-violet-100 text-violet-800",
  feriado: "bg-emerald-100 text-emerald-800",
  institucional: "bg-indigo-100 text-indigo-800",
  vencimento_financeiro: "bg-orange-100 text-orange-800",
  palestra: "bg-teal-100 text-teal-800",
};

/** Cor sólida (bolinha/barrinha no grid do calendário). */
export const EVENT_TYPE_DOT: Record<CalendarEventType, string> = {
  aula: "bg-sky-500",
  prova: "bg-rose-500",
  atividade: "bg-amber-500",
  reuniao: "bg-violet-500",
  feriado: "bg-emerald-500",
  institucional: "bg-indigo-500",
  vencimento_financeiro: "bg-orange-500",
  palestra: "bg-teal-500",
};

export const EVENT_TYPE_OPTIONS = (
  Object.keys(EVENT_TYPE_LABELS) as CalendarEventType[]
).map((value) => ({ value, label: EVENT_TYPE_LABELS[value] }));

export const VISIBILITY_LABELS: Record<EventVisibility, string> = {
  public: "Público (todos)",
  restricted: "Restrito (envolvidos)",
  private: "Somente para mim (privado)",
};

export const VISIBILITY_OPTIONS = (
  Object.keys(VISIBILITY_LABELS) as EventVisibility[]
).map((value) => ({ value, label: VISIBILITY_LABELS[value] }));

export const eventTypeLabel = (t: CalendarEventType) => EVENT_TYPE_LABELS[t] ?? t;
export const visibilityLabel = (v: EventVisibility) => VISIBILITY_LABELS[v] ?? v;
