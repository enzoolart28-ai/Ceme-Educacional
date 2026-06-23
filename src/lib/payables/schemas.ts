import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

export const payeeSchema = z.object({
  name: z.string().min(2, "Informe o nome").max(150),
  type: z.enum(["colaborador", "professor", "preceptor", "fornecedor", "outro"]),
  pix_key: optionalText(140),
  notes: optionalText(500),
});
export type PayeeInput = z.infer<typeof payeeSchema>;

export const payableSchema = z.object({
  category_id: z.string().uuid("Selecione a categoria"),
  payee_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().min(2, "Informe a descrição").max(200),
  competence_month: z.coerce.number().int().min(1).max(12),
  competence_year: z.coerce.number().int().min(2020).max(2100),
  amount: z.coerce.number().min(0, "Valor inválido"),
  due_date: z.string().optional().or(z.literal("")),
  recurring: z.boolean().optional(),
  notes: optionalText(500),
});
export type PayableInput = z.infer<typeof payableSchema>;
