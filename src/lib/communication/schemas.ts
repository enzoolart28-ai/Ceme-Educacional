import { z } from "zod";

const TARGETS_WITH_ID = ["class", "course", "user"];

export const announcementSchema = z
  .object({
    title: z.string().min(2, "Informe o título").max(150),
    message: z.string().min(2, "Escreva a mensagem").max(5000),
    target_type: z.enum(["all", "class", "course", "guardians", "teachers", "user"]),
    target_id: z.string().uuid().optional().or(z.literal("")),
    attachment_url: z.string().optional().or(z.literal("")),
  })
  .refine((d) => !TARGETS_WITH_ID.includes(d.target_type) || !!d.target_id, {
    message: "Selecione o destinatário (turma, curso ou usuário).",
    path: ["target_id"],
  });
export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const messageSchema = z
  .object({
    receiver_id: z.string().uuid("Selecione o destinatário"),
    subject: z.string().max(150).optional().or(z.literal("")),
    body: z.string().max(5000).optional().or(z.literal("")),
    attachment_url: z.string().optional().or(z.literal("")),
  })
  .refine((d) => !!(d.subject?.trim() || d.body?.trim()), {
    message: "Escreva um assunto ou uma mensagem.",
    path: ["body"],
  });
export type MessageInput = z.infer<typeof messageSchema>;
