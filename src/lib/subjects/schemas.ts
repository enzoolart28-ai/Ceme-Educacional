import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().min(2, "Informe o nome da disciplina").max(120),
  code: z.string().max(20).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  workload_hours: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d{1,5}$/.test(v), "Carga horária inválida"),
  status: z.enum(["active", "inactive"]),
});

export type SubjectInput = z.infer<typeof subjectSchema>;
