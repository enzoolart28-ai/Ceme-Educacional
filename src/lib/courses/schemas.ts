import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

const optionalIntString = (max: number, msg: string) =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) <= max), msg);

export const courseSchema = z.object({
  name: z.string().min(2, "Informe o nome do curso").max(150),
  description: optionalText(500),
  modality: z.enum(["presencial", "semipresencial", "ead"]),
  type: z.enum([
    "tecnico",
    "profissionalizante",
    "livre",
    "infantil",
    "preparatorio",
    "reforco",
  ]),
  status: z.enum(["active", "inactive", "planning", "closed"]),
  workload_hours: optionalIntString(100000, "Carga horária inválida"),
  duration: optionalText(60),
  price: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), "Valor inválido (ex.: 1200.00)"),
  certificate_enabled: z.boolean(),
  minimum_attendance: optionalIntString(100, "Frequência mínima inválida (0–100)"),
  minimum_grade: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 10), "Média inválida (0–10)"),
  requirements: optionalText(500),
  notes: optionalText(1000),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const courseSubjectSchema = z.object({
  course_id: z.string().uuid(),
  subject_id: z.string().uuid("Selecione uma disciplina"),
  module_id: z.string().uuid().optional().or(z.literal("")),
  workload_hours: optionalIntString(100000, "Carga horária inválida"),
  teacher_id: z.string().uuid().optional().or(z.literal("")),
});
export type CourseSubjectInput = z.infer<typeof courseSubjectSchema>;

export const courseModuleSchema = z.object({
  course_id: z.string().uuid(),
  name: z.string().min(1, "Informe o nome do módulo").max(120),
  description: optionalText(300),
  workload_hours: optionalIntString(100000, "Carga horária inválida"),
});
export type CourseModuleInput = z.infer<typeof courseModuleSchema>;
