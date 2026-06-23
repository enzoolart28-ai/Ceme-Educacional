import type { PayableStatus, PayeeType } from "@/types/models";

export const PAYABLE_STATUS_LABELS: Record<PayableStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const PAYABLE_STATUS_BADGE: Record<PayableStatus, string> = {
  pendente: "bg-amber-100 text-amber-800",
  pago: "bg-emerald-100 text-emerald-800",
  vencido: "bg-rose-100 text-rose-800",
  cancelado: "bg-slate-100 text-slate-600",
};

export const PAYEE_TYPE_LABELS: Record<PayeeType, string> = {
  colaborador: "Funcionário",
  professor: "Professor",
  preceptor: "Preceptor",
  fornecedor: "Fornecedor",
  outro: "Outro",
};

export const PAYEE_TYPE_OPTIONS = (
  Object.keys(PAYEE_TYPE_LABELS) as PayeeType[]
).map((value) => ({ value, label: PAYEE_TYPE_LABELS[value] }));

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const monthName = (m: number) => MONTH_NAMES[m - 1] ?? String(m);
