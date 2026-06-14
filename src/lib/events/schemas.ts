import { z } from "zod";

const intString = (msg: string) =>
  z.string().optional().or(z.literal("")).refine((v) => !v || /^\d+$/.test(v), msg);

export const eventSchema = z.object({
  name: z.string().min(2, "Informe o nome").max(150),
  description: z.string().max(3000).optional().or(z.literal("")),
  date: z.string().optional().or(z.literal("")),
  start_time: z.string().optional().or(z.literal("")),
  end_time: z.string().optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  target_audience: z.string().max(200).optional().or(z.literal("")),
  max_registrations: intString("Limite inválido"),
  responsible_user_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["planejado", "aberto_inscricao", "encerrado", "cancelado", "finalizado"]),
});
export type EventInput = z.infer<typeof eventSchema>;

/** Inscrição pública (sem login). */
export const registrationSchema = z.object({
  event_id: z.string().uuid(),
  full_name: z.string().min(2, "Informe seu nome").max(150),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  age: intString("Idade inválida"),
  guardian_name: z.string().max(150).optional().or(z.literal("")),
  course_interest: z.string().max(150).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  school: z.string().max(150).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;
