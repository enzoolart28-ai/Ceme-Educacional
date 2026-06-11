import { z } from "zod";
import { isValidCpf } from "@/lib/students/cpf";

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

export const studentSchema = z.object({
  full_name: z.string().min(3, "Informe o nome completo").max(150),
  cpf: z
    .string()
    .min(1, "Informe o CPF")
    .refine(isValidCpf, "CPF inválido"),
  rg: optionalText(20),
  birth_date: optionalText(10),
  phone: optionalText(20),
  email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  address: optionalText(200),
  city: optionalText(100),
  state: optionalText(2),
  mother_name: optionalText(150),
  father_name: optionalText(150),
  status: z.enum([
    "active",
    "inactive",
    "defaulter",
    "locked",
    "transferred",
    "completed",
    "dropout",
  ]),
  notes: optionalText(1000),
});

export type StudentInput = z.infer<typeof studentSchema>;
