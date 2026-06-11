import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

export const classSchema = z.object({
  name: z.string().min(1, "Informe o nome da turma").max(60),
  course_id: z.string().uuid("Selecione um curso"),
  unit_id: z.string().uuid().optional().or(z.literal("")),
  shift: z.enum(["manha", "tarde", "noite", "integral", "sabado"]),
  status: z.enum(["open", "in_progress", "finished", "cancelled"]),
  year: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d{4}$/.test(v), "Ano inválido"),
  start_date: optionalText(10),
  end_date: optionalText(10),
  weekdays: z.array(z.string()),
  start_time: optionalText(5),
  end_time: optionalText(5),
  main_teacher_id: z.string().uuid().optional().or(z.literal("")),
  max_students: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d{1,4}$/.test(v), "Limite inválido"),
});

export type ClassInput = z.infer<typeof classSchema>;

export const linkClassStudentSchema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid("Selecione um aluno"),
  override_limit: z.boolean().optional(),
});
export type LinkClassStudentInput = z.infer<typeof linkClassStudentSchema>;
