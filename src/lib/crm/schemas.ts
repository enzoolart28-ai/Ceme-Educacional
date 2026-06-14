import { z } from "zod";

const intString = (msg: string) =>
  z.string().optional().or(z.literal("")).refine((v) => !v || /^\d{1,3}$/.test(v), msg);

export const leadSchema = z.object({
  full_name: z.string().min(2, "Informe o nome").max(150),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  age: intString("Idade inválida"),
  guardian_name: z.string().max(150).optional().or(z.literal("")),
  course_interest: z.string().max(150).optional().or(z.literal("")),
  source: z.enum([
    "instagram", "whatsapp", "facebook", "indicacao", "evento",
    "palestra", "escola_parceira", "site", "outro",
  ]),
  city: z.string().max(120).optional().or(z.literal("")),
  status: z.enum([
    "novo", "em_atendimento", "aguardando_retorno", "agendado",
    "compareceu", "matriculado", "desistiu", "sem_resposta",
  ]),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const interactionSchema = z.object({
  lead_id: z.string().uuid(),
  interaction_type: z.enum([
    "ligacao", "whatsapp", "email", "presencial", "agendamento", "observacao", "outro",
  ]),
  description: z.string().max(2000).optional().or(z.literal("")),
  next_contact_at: z.string().optional().or(z.literal("")),
});
export type InteractionInput = z.infer<typeof interactionSchema>;
