import { z } from "zod";

const money = z.coerce.number().min(0);
const positiveMoney = z.coerce.number().positive();

export const openCashSessionSchema = z.object({
  cashRegisterId: z.string().uuid(),
  unitId: z.string().uuid().optional().or(z.literal("")),
  openingBalance: money.default(0),
  notes: z.string().optional(),
});

export const cashMovementSchema = z.object({
  cashSessionId: z.string().uuid(),
  movementType: z.enum(["entry", "exit", "reinforcement", "withdrawal", "reversal", "adjustment"]),
  category: z.string().min(2),
  description: z.string().optional(),
  amount: positiveMoney,
  paymentMethod: z.enum(["cash", "pix", "credit_card", "debit_card", "bank_slip", "transfer", "other"]),
  costCenterId: z.string().uuid().optional().or(z.literal("")),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  financialRequestId: z.string().uuid().optional().or(z.literal("")),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
});

export const closeCashSessionSchema = z.object({
  cashSessionId: z.string().uuid(),
  informedClosingBalance: money,
  differenceReason: z.string().optional(),
});

export const reviewCashSessionSchema = z.object({
  cashSessionId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "under_review"]),
  notes: z.string().min(3),
});

export type OpenCashSessionInput = z.infer<typeof openCashSessionSchema>;
export type CashMovementInput = z.infer<typeof cashMovementSchema>;
export type CloseCashSessionInput = z.infer<typeof closeCashSessionSchema>;
export type ReviewCashSessionInput = z.infer<typeof reviewCashSessionSchema>;

