import { z } from "zod";
import { isValidCpf } from "@/lib/students/cpf";

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

export const teacherSchema = z.object({
  full_name: z.string().min(3, "Informe o nome completo").max(150),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isValidCpf(v), "CPF inválido"),
  rg: optionalText(20),
  phone: optionalText(20),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  education: optionalText(200),
  expertise_area: optionalText(120),
  workload: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (/^\d{1,3}$/.test(v) && Number(v) <= 80),
      "Carga horária inválida (0–80)",
    ),
  status: z.enum(["active", "inactive", "on_leave", "dismissed"]),
  notes: optionalText(1000),
});

export type TeacherInput = z.infer<typeof teacherSchema>;

export const teacherSubjectSchema = z.object({
  teacher_id: z.string().uuid(),
  subject_id: z.string().uuid("Selecione uma disciplina"),
});
export type TeacherSubjectInput = z.infer<typeof teacherSubjectSchema>;

export const teacherClassSchema = z.object({
  teacher_id: z.string().uuid(),
  class_id: z.string().uuid("Selecione uma turma"),
});
export type TeacherClassInput = z.infer<typeof teacherClassSchema>;
