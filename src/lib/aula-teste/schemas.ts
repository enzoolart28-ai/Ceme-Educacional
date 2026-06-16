import { z } from "zod";

// --- Configurações institucionais ---------------------------------------------
export const atSettingsSchema = z.object({
  institution_name: z.string().min(1, "Informe o nome da instituição").max(200),
  cnpj: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").max(150).optional().or(z.literal("")),
  sector: z.string().max(150).optional().or(z.literal("")),
});
export type AtSettingsInput = z.infer<typeof atSettingsSchema>;

// --- Pesos (0–100 por seção, como string vinda do formulário) ------------------
const weightField = z
  .string()
  .refine((v) => /^\d{1,3}$/.test(v) && Number(v) >= 0 && Number(v) <= 100, "Use 0 a 100");
export const atWeightsSchema = z.object({
  curricular: weightField,
  plano_aula: weightField,
  didatica: weightField,
  dominio: weightField,
  professor_atual: weightField,
  alunos: weightField,
  pais: weightField,
});
export type AtWeightsInput = z.infer<typeof atWeightsSchema>;

// --- Critério ------------------------------------------------------------------
export const atCriterionSchema = z.object({
  id: z.string().uuid().optional(),
  section: z.enum([
    "curricular",
    "plano_aula",
    "didatica",
    "dominio",
    "professor_atual",
    "comissao",
  ]),
  label: z.string().min(2, "Informe o critério").max(200),
});
export type AtCriterionInput = z.infer<typeof atCriterionSchema>;

// --- Criação de relatório (candidato + dados básicos da vaga) ------------------
export const reportCreateSchema = z.object({
  full_name: z.string().min(2, "Informe o nome do candidato").max(150),
  cpf: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").max(150).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  position_title: z.string().max(150).optional().or(z.literal("")),
  discipline: z.string().max(150).optional().or(z.literal("")),
  unit_id: z.string().uuid().optional().or(z.literal("")),
  modality: z.string().max(80).optional().or(z.literal("")),
  test_date: z.string().optional().or(z.literal("")),
});
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
