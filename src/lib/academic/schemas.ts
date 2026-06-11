import { z } from "zod";

export const courseSchema = z.object({
  name: z.string().min(2, "Informe o nome do curso").max(120),
  description: z.string().max(300).optional().or(z.literal("")),
});
export type CourseInput = z.infer<typeof courseSchema>;

export const subjectSchema = z.object({
  name: z.string().min(2, "Informe o nome da disciplina").max(120),
  code: z.string().max(20).optional().or(z.literal("")),
});
export type SubjectInput = z.infer<typeof subjectSchema>;

const currentYear = new Date().getFullYear();

export const classSchema = z.object({
  name: z.string().min(1, "Informe o nome da turma").max(60),
  course_id: z.string().uuid("Selecione um curso"),
  year: z
    .number({ message: "Ano inválido" })
    .int()
    .min(2000, "Ano inválido")
    .max(currentYear + 5, "Ano inválido"),
  shift: z.enum(["manha", "tarde", "noite", "integral"]),
});
export type ClassInput = z.infer<typeof classSchema>;

export const enrollSchema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid("Selecione um aluno"),
});
export type EnrollInput = z.infer<typeof enrollSchema>;

export const assignTeacherSchema = z.object({
  class_id: z.string().uuid(),
  teacher_id: z.string().uuid("Selecione um professor"),
  subject_id: z.string().uuid("Selecione uma disciplina"),
});
export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;
