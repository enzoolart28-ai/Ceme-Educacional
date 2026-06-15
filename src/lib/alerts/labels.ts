import type { AlertType, AlertPriority, AlertStatus } from "@/types/models";

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  frequencia_baixa: "Frequência abaixo de 75%",
  faltas_consecutivas: "3 faltas seguidas",
  mensalidade_vencida: "Mensalidade vencida",
  ava_inativo: "Sem acessar o AVA há 7 dias",
  chamada_pendente: "Chamada pendente",
  atividade_sem_correcao: "Atividade sem correção",
  documento_pendente: "Documento pendente",
  certificado_pendente: "Certificado pendente",
  lead_sem_retorno: "Lead sem retorno",
  evento_proximo: "Evento próximo",
  prova_proxima: "Prova próxima",
};
export const ALERT_TYPE_OPTIONS = (
  Object.keys(ALERT_TYPE_LABELS) as AlertType[]
).map((value) => ({ value, label: ALERT_TYPE_LABELS[value] }));

export const ALERT_PRIORITY_LABELS: Record<AlertPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};
export const ALERT_PRIORITY_BADGE: Record<AlertPriority, string> = {
  baixa: "bg-slate-100 text-slate-700",
  media: "bg-sky-100 text-sky-800",
  alta: "bg-amber-100 text-amber-800",
  critica: "bg-rose-100 text-rose-800",
};
export const ALERT_PRIORITY_OPTIONS = (
  Object.keys(ALERT_PRIORITY_LABELS) as AlertPriority[]
).map((value) => ({ value, label: ALERT_PRIORITY_LABELS[value] }));
/** Peso para ordenação: crítica > alta > média > baixa. */
export const ALERT_PRIORITY_RANK: Record<AlertPriority, number> = {
  critica: 4,
  alta: 3,
  media: 2,
  baixa: 1,
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  novo: "Novo",
  visualizado: "Visualizado",
  resolvido: "Resolvido",
  ignorado: "Ignorado",
};
export const ALERT_STATUS_BADGE: Record<AlertStatus, string> = {
  novo: "bg-indigo-100 text-indigo-800",
  visualizado: "bg-slate-200 text-slate-700",
  resolvido: "bg-emerald-100 text-emerald-800",
  ignorado: "bg-slate-100 text-slate-500",
};
export const ALERT_STATUS_OPTIONS = (
  Object.keys(ALERT_STATUS_LABELS) as AlertStatus[]
).map((value) => ({ value, label: ALERT_STATUS_LABELS[value] }));

export const alertTypeLabel = (t: AlertType) => ALERT_TYPE_LABELS[t] ?? t;
export const alertPriorityLabel = (p: AlertPriority) => ALERT_PRIORITY_LABELS[p] ?? p;
export const alertStatusLabel = (s: AlertStatus) => ALERT_STATUS_LABELS[s] ?? s;
