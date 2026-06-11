import { z } from "zod";
import { isValidCpf } from "@/lib/students/cpf";

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

export const guardianSchema = z.object({
  full_name: z.string().min(3, "Informe o nome completo").max(150),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isValidCpf(v), "CPF inválido"),
  rg: optionalText(20),
  phone: optionalText(20),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  address: optionalText(200),
  city: optionalText(100),
  state: optionalText(2),
  kinship: optionalText(40),
  notes: optionalText(1000),
});

export type GuardianInput = z.infer<typeof guardianSchema>;

export const linkStudentSchema = z.object({
  guardian_id: z.string().uuid(),
  student_id: z.string().uuid("Selecione um aluno"),
  is_financial_responsible: z.boolean(),
  is_pedagogical_responsible: z.boolean(),
});

export type LinkStudentInput = z.infer<typeof linkStudentSchema>;
