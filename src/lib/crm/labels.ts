import type { LeadSource, LeadStatus, LeadInteractionType } from "@/types/models";

// --- Origem ------------------------------------------------------------------
export const SOURCE_LABELS: Record<LeadSource, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  indicacao: "Indicação",
  evento: "Evento",
  palestra: "Palestra",
  escola_parceira: "Escola parceira",
  site: "Site",
  outro: "Outro",
};
export const SOURCE_OPTIONS = (Object.keys(SOURCE_LABELS) as LeadSource[]).map((value) => ({
  value,
  label: SOURCE_LABELS[value],
}));

// --- Status (ordem usada no Kanban) ------------------------------------------
export const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  aguardando_retorno: "Aguardando retorno",
  agendado: "Agendado",
  compareceu: "Compareceu",
  matriculado: "Matriculado",
  desistiu: "Desistiu",
  sem_resposta: "Sem resposta",
};

export const STATUS_BADGE: Record<LeadStatus, string> = {
  novo: "bg-sky-100 text-sky-800",
  em_atendimento: "bg-indigo-100 text-indigo-800",
  aguardando_retorno: "bg-amber-100 text-amber-800",
  agendado: "bg-violet-100 text-violet-800",
  compareceu: "bg-teal-100 text-teal-800",
  matriculado: "bg-emerald-100 text-emerald-800",
  desistiu: "bg-rose-100 text-rose-800",
  sem_resposta: "bg-slate-200 text-slate-700",
};

export const KANBAN_STATUSES: LeadStatus[] = [
  "novo",
  "em_atendimento",
  "aguardando_retorno",
  "agendado",
  "compareceu",
  "matriculado",
  "desistiu",
  "sem_resposta",
];

export const STATUS_OPTIONS = KANBAN_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

// --- Tipo de interação -------------------------------------------------------
export const INTERACTION_TYPE_LABELS: Record<LeadInteractionType, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  presencial: "Presencial",
  agendamento: "Agendamento",
  observacao: "Observação",
  outro: "Outro",
};
export const INTERACTION_TYPE_OPTIONS = (
  Object.keys(INTERACTION_TYPE_LABELS) as LeadInteractionType[]
).map((value) => ({ value, label: INTERACTION_TYPE_LABELS[value] }));

export const sourceLabel = (s: LeadSource) => SOURCE_LABELS[s] ?? s;
export const statusLabel = (s: LeadStatus) => STATUS_LABELS[s] ?? s;
export const interactionTypeLabel = (t: LeadInteractionType) => INTERACTION_TYPE_LABELS[t] ?? t;
