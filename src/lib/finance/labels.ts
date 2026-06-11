export const INVOICE_STATUS = [
  "paid",
  "open",
  "overdue",
  "partial",
  "cancelled",
  "renegotiated",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[number];

export const PAYMENT_METHODS = [
  "cash",
  "pix",
  "credit_card",
  "debit_card",
  "bank_slip",
  "transfer",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: "Pago",
  open: "Em aberto",
  overdue: "Vencido",
  partial: "Parcial",
  cancelled: "Cancelado",
  renegotiated: "Renegociado",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  bank_slip: "Boleto",
  transfer: "Transferência",
  other: "Outro",
};

export const INVOICE_STATUS_OPTIONS = INVOICE_STATUS.map((value) => ({
  value,
  label: INVOICE_STATUS_LABELS[value],
}));

export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

