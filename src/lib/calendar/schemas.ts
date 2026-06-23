import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().min(2, "Informe o título").max(150),
    description: z.string().max(2000).optional().or(z.literal("")),
    type: z.enum([
      "aula",
      "prova",
      "atividade",
      "reuniao",
      "feriado",
      "institucional",
      "vencimento_financeiro",
      "palestra",
    ]),
    start_datetime: z.string().min(1, "Informe a data/hora inicial"),
    end_datetime: z.string().optional().or(z.literal("")),
    course_id: z.string().uuid().optional().or(z.literal("")),
    class_id: z.string().uuid().optional().or(z.literal("")),
    unit_id: z.string().uuid().optional().or(z.literal("")),
    teacher_id: z.string().uuid().optional().or(z.literal("")),
    location: z.string().max(200).optional().or(z.literal("")),
    visibility: z.enum(["public", "restricted", "private"]),
  })
  .refine(
    (d) => !d.end_datetime || !d.start_datetime || d.end_datetime >= d.start_datetime,
    { message: "O término deve ser depois do início.", path: ["end_datetime"] },
  );

export type EventInput = z.infer<typeof eventSchema>;
