import { z } from "zod";

const decimalString = (msg: string) =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), msg);

export const assessmentSchema = z.object({
  name: z.string().min(2, "Informe o nome da avaliação").max(120),
  type: z.enum([
    "prova",
    "trabalho",
    "atividade",
    "participacao",
    "recuperacao",
    "projeto",
    "pratica",
  ]),
  class_id: z.string().uuid("Selecione a turma"),
  subject_id: z.string().uuid().optional().or(z.literal("")),
  weight: decimalString("Peso inválido"),
  max_grade: decimalString("Nota máxima inválida"),
  date: z.string().max(10).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;
