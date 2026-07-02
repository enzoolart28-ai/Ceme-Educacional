import { z } from "zod";

// Captação rápida de lead (aberta a qualquer perfil): só os essenciais.
export const quickLeadSchema = z.object({
  full_name: z.string().min(3, "Informe o nome completo").max(150),
  phone: z.string().min(8, "Informe um número válido").max(20),
  course_interest: z.string().min(2, "Informe o curso desejado").max(120),
});

export type QuickLeadInput = z.infer<typeof quickLeadSchema>;
