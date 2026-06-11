import { z } from "zod";
import { INVOICE_STATUS, PAYMENT_METHODS } from "@/lib/finance/labels";

const moneyString = (label: string) =>
  z
    .string()
    .min(1, `${label} é obrigatório`)
    .refine((value) => Number(value.replace(",", ".")) >= 0, `${label} inválido`);

const optionalMoneyString = (label: string) =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || Number(value.replace(",", ".")) >= 0,
      `${label} inválido`,
    );

export const financialPlanSchema = z.object({
  name: z.string().min(3, "Informe o nome do plano").max(140),
  course_id: z.string().optional().or(z.literal("")),
  total_value: moneyString("Valor total"),
  installments: z
    .string()
    .min(1, "Informe a quantidade de parcelas")
    .refine((value) => Number(value) > 0, "Parcelas deve ser maior que zero"),
  due_day: z
    .string()
    .min(1, "Informe o dia de vencimento")
    .refine((value) => {
      const day = Number(value);
      return Number.isInteger(day) && day >= 1 && day <= 28;
    }, "Use um dia entre 1 e 28"),
  discount_value: optionalMoneyString("Desconto"),
  scholarship_percentage: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => {
      if (!value) return true;
      const n = Number(value.replace(",", "."));
      return n >= 0 && n <= 100;
    }, "Bolsa deve estar entre 0 e 100%"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type FinancialPlanInput = z.infer<typeof financialPlanSchema>;

export const generateInvoicesSchema = z.object({
  plan_id: z.string().min(1, "Selecione um plano"),
  enrollment_id: z.string().min(1, "Selecione uma matrícula"),
  first_due_month: z.string().min(7, "Informe o mês inicial"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type GenerateInvoicesInput = z.infer<typeof generateInvoicesSchema>;

export const paymentSchema = z.object({
  amount: moneyString("Valor pago"),
  payment_method: z.enum(PAYMENT_METHODS),
  paid_at: z.string().min(1, "Informe a data do pagamento"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const invoiceAdjustmentSchema = z.object({
  discount_value: optionalMoneyString("Desconto/bolsa"),
  fine_value: optionalMoneyString("Multa"),
  interest_value: optionalMoneyString("Juros"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type InvoiceAdjustmentInput = z.infer<typeof invoiceAdjustmentSchema>;

export const renegotiationSchema = z.object({
  amount: moneyString("Novo valor"),
  due_date: z.string().min(1, "Informe o novo vencimento"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type RenegotiationInput = z.infer<typeof renegotiationSchema>;

export const cancelInvoiceSchema = z.object({
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;

export const invoiceStatusFilterSchema = z.enum(INVOICE_STATUS).optional();

