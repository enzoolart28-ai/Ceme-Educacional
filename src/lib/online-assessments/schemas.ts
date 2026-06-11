import { z } from "zod";

const decimalString = (msg: string) =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), msg);

const intString = (msg: string) =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d+$/.test(v), msg);

// --- Prova / atividade -------------------------------------------------------
export const onlineAssessmentSchema = z.object({
  title: z.string().min(2, "Informe o título").max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  course_id: z.string().uuid().optional().or(z.literal("")),
  class_id: z.string().uuid("Selecione a turma"),
  subject_id: z.string().uuid().optional().or(z.literal("")),
  teacher_id: z.string().uuid().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  time_limit_minutes: intString("Tempo limite inválido"),
  max_attempts: intString("Número de tentativas inválido"),
  max_grade: decimalString("Nota máxima inválida"),
  min_grade: decimalString("Nota mínima inválida"),
  correction_type: z.enum(["automatic", "manual"]),
  show_answer_key: z.boolean(),
  shuffle_questions: z.boolean(),
  shuffle_options: z.boolean(),
  status: z.enum(["draft", "published", "closed", "archived"]),
});
export type OnlineAssessmentInput = z.infer<typeof onlineAssessmentSchema>;

// --- Questão (validação no servidor) -----------------------------------------
export const questionSchema = z.object({
  assessment_id: z.string().uuid(),
  type: z.enum([
    "multiple_choice",
    "true_false",
    "essay",
    "file_upload",
    "image",
    "video",
    "matching",
  ]),
  statement: z.string().min(1, "Informe o enunciado").max(2000),
  media_url: z.string().optional().or(z.literal("")),
  points: decimalString("Pontuação inválida"),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "Texto da alternativa obrigatório"),
        is_correct: z.boolean(),
      }),
    )
    .optional(),
});
export type QuestionInput = z.infer<typeof questionSchema>;
