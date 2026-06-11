import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(""));

export const lessonSchema = z.object({
  course_id: z.string().uuid("Selecione o curso"),
  module_id: z.string().uuid().optional().or(z.literal("")),
  subject_id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2, "Informe o título").max(150),
  description: optionalText(1000),
  video_url: z.string().url("URL inválida").optional().or(z.literal("")),
  release_type: z.enum(["all", "date", "after_previous"]),
  release_date: optionalText(10),
  status: z.enum(["draft", "published", "archived"]),
});
export type LessonInput = z.infer<typeof lessonSchema>;

export const materialSchema = z
  .object({
    lesson_id: z.string().uuid(),
    title: z.string().min(1, "Informe o título").max(150),
    type: z.enum(["video", "pdf", "slides", "link", "file"]),
    file_url: z.string().optional().or(z.literal("")),
    external_url: z.string().url("URL inválida").optional().or(z.literal("")),
  })
  .refine((d) => !!d.file_url || !!d.external_url, {
    message: "Envie um arquivo ou informe um link.",
    path: ["external_url"],
  });
export type MaterialInput = z.infer<typeof materialSchema>;
