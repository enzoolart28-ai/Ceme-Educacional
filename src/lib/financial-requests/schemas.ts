import { z } from "zod";

const optionalUuid = z.string().uuid().optional().or(z.literal(""));

export const financialRequestSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  requestedAmount: z.coerce.number().positive(),
  requiredDate: z.string().optional(),
  departmentId: optionalUuid,
  unitId: optionalUuid,
  costCenterId: optionalUuid,
  expenseCategory: z.string().min(2),
  beneficiaryName: z.string().optional(),
  beneficiaryDocument: z.string().optional(),
  desiredPaymentMethod: z.enum(["cash", "pix", "credit_card", "debit_card", "bank_slip", "transfer", "other"]),
  justification: z.string().min(5),
  priority: z.enum(["baixa", "media", "alta", "urgente"]),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
  submit: z.coerce.boolean().default(false),
});

export const managerDecisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum([
    "approved",
    "partially_approved",
    "rejected",
    "needs_information",
    "returned_for_correction",
    "forwarded_to_direction",
  ]),
  approvedAmount: z.coerce.number().min(0).optional(),
  reason: z.string().min(5),
});

export const payFinancialRequestSchema = z.object({
  requestId: z.string().uuid(),
  cashSessionId: z.string().uuid(),
  paidAmount: z.coerce.number().positive(),
  paymentMethod: z.enum(["cash", "pix", "credit_card", "debit_card", "bank_slip", "transfer", "other"]),
  paymentProofUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type FinancialRequestInput = z.infer<typeof financialRequestSchema>;
export type ManagerDecisionInput = z.infer<typeof managerDecisionSchema>;
export type PayFinancialRequestInput = z.infer<typeof payFinancialRequestSchema>;

