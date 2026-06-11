import type {
  OnlineAssessmentStatus,
  CorrectionType,
  QuestionType,
  SubmissionStatus,
} from "@/types/models";

// --- Status da prova ---------------------------------------------------------
export const ASSESSMENT_STATUS_LABELS: Record<OnlineAssessmentStatus, string> = {
  draft: "Rascunho",
  published: "Publicada",
  closed: "Encerrada",
  archived: "Arquivada",
};

export const ASSESSMENT_STATUS_BADGE: Record<OnlineAssessmentStatus, string> = {
  draft: "bg-slate-200 text-slate-700",
  published: "bg-emerald-100 text-emerald-800",
  closed: "bg-amber-100 text-amber-800",
  archived: "bg-slate-100 text-slate-500",
};

export const ASSESSMENT_STATUS_OPTIONS = (
  Object.keys(ASSESSMENT_STATUS_LABELS) as OnlineAssessmentStatus[]
).map((value) => ({ value, label: ASSESSMENT_STATUS_LABELS[value] }));

// --- Tipo de correção --------------------------------------------------------
export const CORRECTION_TYPE_LABELS: Record<CorrectionType, string> = {
  automatic: "Automática",
  manual: "Manual",
};

export const CORRECTION_TYPE_OPTIONS = (
  Object.keys(CORRECTION_TYPE_LABELS) as CorrectionType[]
).map((value) => ({ value, label: CORRECTION_TYPE_LABELS[value] }));

// --- Tipo de questão ---------------------------------------------------------
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Múltipla escolha",
  true_false: "Verdadeiro ou falso",
  essay: "Dissertativa",
  file_upload: "Envio de arquivo",
  image: "Questão com imagem",
  video: "Questão com vídeo",
  matching: "Associação de colunas",
};

export const QUESTION_TYPE_OPTIONS = (
  Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]
).map((value) => ({ value, label: QUESTION_TYPE_LABELS[value] }));

/** Questões corrigidas automaticamente (objetivas). */
export const OBJECTIVE_TYPES: QuestionType[] = [
  "multiple_choice",
  "true_false",
  "matching",
];

/** Questões com alternativas a definir. */
export const OPTION_TYPES: QuestionType[] = [
  "multiple_choice",
  "true_false",
  "matching",
];

export const isObjective = (t: QuestionType) => OBJECTIVE_TYPES.includes(t);
export const hasOptions = (t: QuestionType) => OPTION_TYPES.includes(t);

// --- Status da tentativa -----------------------------------------------------
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  in_progress: "Em andamento",
  submitted: "Enviada (aguardando correção)",
  graded: "Corrigida",
};

export const SUBMISSION_STATUS_BADGE: Record<SubmissionStatus, string> = {
  in_progress: "bg-sky-100 text-sky-800",
  submitted: "bg-amber-100 text-amber-800",
  graded: "bg-emerald-100 text-emerald-800",
};

// --- Helpers -----------------------------------------------------------------
export const assessmentStatusLabel = (s: OnlineAssessmentStatus) =>
  ASSESSMENT_STATUS_LABELS[s] ?? s;
export const correctionTypeLabel = (c: CorrectionType) =>
  CORRECTION_TYPE_LABELS[c] ?? c;
export const questionTypeLabel = (t: QuestionType) => QUESTION_TYPE_LABELS[t] ?? t;
export const submissionStatusLabel = (s: SubmissionStatus) =>
  SUBMISSION_STATUS_LABELS[s] ?? s;

/** Delimitador usado em assessment_options.text para questões de associação. */
export const MATCH_DELIM = ":::";
