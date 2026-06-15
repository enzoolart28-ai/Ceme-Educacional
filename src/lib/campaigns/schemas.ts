import { z } from "zod";

const intString = (msg: string) =>
  z.string().optional().or(z.literal("")).refine((v) => !v || /^\d+$/.test(v), msg);
const decimalString = (msg: string) =>
  z.string().optional().or(z.literal("")).refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), msg);

export const campaignSchema = z.object({
  name: z.string().min(2, "Informe o nome").max(150),
  description: z.string().max(3000).optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  target_audience: z.string().max(200).optional().or(z.literal("")),
  rules: z.string().max(3000).optional().or(z.literal("")),
  prizes: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["rascunho", "ativa", "encerrada", "cancelada"]),
});
export type CampaignInput = z.infer<typeof campaignSchema>;

export const levelSchema = z.object({
  campaign_id: z.string().uuid(),
  name: z.string().min(1, "Informe o nome do nível").max(150),
  description: z.string().max(1000).optional().or(z.literal("")),
  difficulty: z.enum(["facil", "medio", "dificil"]),
  order_index: intString("Ordem inválida"),
});
export type LevelInput = z.infer<typeof levelSchema>;

export const participantSchema = z.object({
  campaign_id: z.string().uuid(),
  full_name: z.string().min(2, "Informe o nome").max(150),
  age: intString("Idade inválida"),
  phone: z.string().max(40).optional().or(z.literal("")),
  father_name: z.string().max(150).optional().or(z.literal("")),
  mother_name: z.string().max(150).optional().or(z.literal("")),
  guardian_name: z.string().max(150).optional().or(z.literal("")),
  school: z.string().max(150).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  status: z.enum(["inscrito", "em_andamento", "concluido", "desistente"]),
});
export type ParticipantInput = z.infer<typeof participantSchema>;

export const progressSchema = z.object({
  participant_id: z.string().uuid(),
  level_id: z.string().uuid("Selecione o nível"),
  score: decimalString("Pontuação inválida"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});
export type ProgressInput = z.infer<typeof progressSchema>;
