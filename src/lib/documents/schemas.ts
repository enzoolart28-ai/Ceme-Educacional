import { z } from "zod";

const DOC_TYPES = [
  "rg",
  "cpf",
  "comprovante_residencia",
  "historico_escolar",
  "certidao",
  "contrato",
  "termo_matricula",
  "termo_estagio",
  "comprovante_pagamento",
  "outros",
] as const;

const GEN_TYPES = [
  "declaracao_matricula",
  "declaracao_frequencia",
  "contrato_educacional",
  "historico_escolar",
  "recibo",
  "comprovante_financeiro",
  "relatorio_academico",
] as const;

export const documentSchema = z.object({
  student_id: z.string().uuid("Selecione o aluno"),
  type: z.enum(DOC_TYPES),
  title: z.string().min(2, "Informe o título").max(150),
  file_url: z.string().min(1, "Envie o arquivo"),
});
export type DocumentInput = z.infer<typeof documentSchema>;

export const generateDocumentSchema = z.object({
  student_id: z.string().uuid("Selecione o aluno"),
  type: z.enum(GEN_TYPES),
  enrollment_id: z.string().uuid().optional().or(z.literal("")),
});
export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;
