import type {
  DocumentType,
  DocumentStatus,
  GeneratedDocumentType,
} from "@/types/models";

// --- Tipo de documento (upload) ----------------------------------------------
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  rg: "RG",
  cpf: "CPF",
  comprovante_residencia: "Comprovante de residência",
  historico_escolar: "Histórico escolar",
  certidao: "Certidão",
  contrato: "Contrato",
  termo_matricula: "Termo de matrícula",
  termo_estagio: "Termo de estágio",
  comprovante_pagamento: "Comprovante de pagamento",
  outros: "Outros",
};

export const DOCUMENT_TYPE_OPTIONS = (
  Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]
).map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] }));

// --- Status ------------------------------------------------------------------
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pendente: "Pendente",
  enviado: "Enviado",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

export const DOCUMENT_STATUS_BADGE: Record<DocumentStatus, string> = {
  pendente: "bg-slate-200 text-slate-700",
  enviado: "bg-sky-100 text-sky-800",
  aprovado: "bg-emerald-100 text-emerald-800",
  reprovado: "bg-rose-100 text-rose-800",
};

export const DOCUMENT_STATUS_OPTIONS = (
  Object.keys(DOCUMENT_STATUS_LABELS) as DocumentStatus[]
).map((value) => ({ value, label: DOCUMENT_STATUS_LABELS[value] }));

// --- Documentos gerados (PDF) ------------------------------------------------
export const GENERATED_DOCUMENT_TYPE_LABELS: Record<GeneratedDocumentType, string> = {
  declaracao_matricula: "Declaração de Matrícula",
  declaracao_frequencia: "Declaração de Frequência",
  contrato_educacional: "Contrato Educacional",
  historico_escolar: "Histórico Escolar",
  recibo: "Recibo",
  comprovante_financeiro: "Comprovante Financeiro",
  relatorio_academico: "Relatório Acadêmico",
};

export const GENERATED_DOCUMENT_TYPE_OPTIONS = (
  Object.keys(GENERATED_DOCUMENT_TYPE_LABELS) as GeneratedDocumentType[]
).map((value) => ({ value, label: GENERATED_DOCUMENT_TYPE_LABELS[value] }));

// --- Helpers -----------------------------------------------------------------
export const documentTypeLabel = (t: DocumentType) => DOCUMENT_TYPE_LABELS[t] ?? t;
export const documentStatusLabel = (s: DocumentStatus) => DOCUMENT_STATUS_LABELS[s] ?? s;
export const generatedDocumentTypeLabel = (t: GeneratedDocumentType) =>
  GENERATED_DOCUMENT_TYPE_LABELS[t] ?? t;
