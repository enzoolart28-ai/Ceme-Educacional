import type { AssessmentType } from "@/types/models";

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  prova: "Prova",
  trabalho: "Trabalho",
  atividade: "Atividade",
  participacao: "Participação",
  recuperacao: "Recuperação",
  projeto: "Projeto",
  pratica: "Avaliação prática",
};

export const ASSESSMENT_TYPE_OPTIONS = (
  Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[]
).map((value) => ({ value, label: ASSESSMENT_TYPE_LABELS[value] }));

export const assessmentTypeLabel = (t: AssessmentType) =>
  ASSESSMENT_TYPE_LABELS[t] ?? t;

// --- Situação acadêmica ------------------------------------------------------
export type SituationStatus = "aprovado" | "recuperacao" | "reprovado" | "sem_nota";

export const SITUATION_LABELS: Record<SituationStatus, string> = {
  aprovado: "Aprovado",
  recuperacao: "Recuperação",
  reprovado: "Reprovado",
  sem_nota: "Sem nota",
};

export const SITUATION_BADGE: Record<SituationStatus, string> = {
  aprovado: "bg-emerald-100 text-emerald-800",
  recuperacao: "bg-amber-100 text-amber-800",
  reprovado: "bg-rose-100 text-rose-800",
  sem_nota: "bg-slate-200 text-slate-700",
};

export const situationLabel = (s: SituationStatus) => SITUATION_LABELS[s] ?? s;
