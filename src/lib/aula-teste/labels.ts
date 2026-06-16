import type {
  AtReportStatus,
  AtProcessStatus,
  AtEvaluationType,
  AtAttachmentKind,
  AtSignatureRole,
  AtTeachingModality,
} from "@/types/models";

// --- Status do relatório ------------------------------------------------------
export const AT_REPORT_STATUS_LABELS: Record<AtReportStatus, string> = {
  rascunho: "Rascunho",
  finalizado: "Finalizado",
  reaberto: "Reaberto",
};
export const AT_REPORT_STATUS_BADGE: Record<AtReportStatus, string> = {
  rascunho: "bg-slate-200 text-slate-700",
  finalizado: "bg-emerald-100 text-emerald-800",
  reaberto: "bg-amber-100 text-amber-800",
};

// --- Situação do processo (definida manualmente pela comissão) -----------------
export const AT_PROCESS_STATUS_LABELS: Record<AtProcessStatus, string> = {
  em_andamento: "Avaliação em andamento",
  pendente_documentacao: "Pendente de documentação",
  pendente_nova_aula: "Pendente de nova aula",
  encaminhado: "Encaminhado para próxima etapa",
  finalizado: "Processo finalizado",
};
export const AT_PROCESS_STATUS_BADGE: Record<AtProcessStatus, string> = {
  em_andamento: "bg-sky-100 text-sky-800",
  pendente_documentacao: "bg-amber-100 text-amber-800",
  pendente_nova_aula: "bg-amber-100 text-amber-800",
  encaminhado: "bg-indigo-100 text-indigo-800",
  finalizado: "bg-emerald-100 text-emerald-800",
};
export const AT_PROCESS_STATUS_OPTIONS = (
  Object.keys(AT_PROCESS_STATUS_LABELS) as AtProcessStatus[]
).map((value) => ({ value, label: AT_PROCESS_STATUS_LABELS[value] }));

// --- Seções de avaliação ------------------------------------------------------
export const AT_EVALUATION_TYPE_LABELS: Record<AtEvaluationType, string> = {
  curricular: "Análise curricular",
  plano_aula: "Plano de aula",
  didatica: "Didática",
  dominio: "Domínio da temática",
  professor_atual: "Professor atual da turma",
  comissao: "Coordenação / Comissão",
};

// --- Seções que entram no cálculo de pesos ------------------------------------
export type AtWeightSection =
  | "curricular"
  | "plano_aula"
  | "didatica"
  | "dominio"
  | "professor_atual"
  | "alunos"
  | "pais";

export const AT_WEIGHT_SECTION_LABELS: Record<AtWeightSection, string> = {
  curricular: "Análise curricular",
  plano_aula: "Plano de aula",
  didatica: "Didática",
  dominio: "Domínio da temática",
  professor_atual: "Avaliação do professor atual",
  alunos: "Avaliação dos alunos",
  pais: "Avaliação dos pais/responsáveis",
};
export const AT_WEIGHT_SECTIONS = Object.keys(AT_WEIGHT_SECTION_LABELS) as AtWeightSection[];

// --- Escala de notas 1–5 ------------------------------------------------------
export const AT_SCORE_SCALE: { value: number; label: string }[] = [
  { value: 1, label: "1 – Insuficiente" },
  { value: 2, label: "2 – Abaixo do esperado" },
  { value: 3, label: "3 – Adequado" },
  { value: 4, label: "4 – Muito bom" },
  { value: 5, label: "5 – Excelente" },
];
export const scoreScaleLabel = (n: number | null | undefined) =>
  AT_SCORE_SCALE.find((s) => s.value === n)?.label ?? "Não avaliado";

// --- Modalidade da aula-teste -------------------------------------------------
export const AT_MODALITY_LABELS: Record<AtTeachingModality, string> = {
  presencial: "Presencial",
  remota: "Remota",
  hibrida: "Híbrida",
};
export const AT_MODALITY_OPTIONS = (
  Object.keys(AT_MODALITY_LABELS) as AtTeachingModality[]
).map((value) => ({ value, label: AT_MODALITY_LABELS[value] }));

// --- Anexos e assinaturas -----------------------------------------------------
export const AT_ATTACHMENT_KIND_LABELS: Record<AtAttachmentKind, string> = {
  curriculo: "Currículo",
  plano_aula: "Plano de aula",
  assinatura: "Assinatura",
  outro: "Outro",
};
export const AT_SIGNATURE_ROLE_LABELS: Record<AtSignatureRole, string> = {
  candidato: "Candidato",
  professor_atual: "Professor atual",
  coordenador: "Coordenador",
  avaliador: "Avaliador",
  responsavel_processo: "Responsável pelo processo seletivo",
};

// --- Etapas do assistente (wizard) -------------------------------------------
// `ready` indica que a etapa já está implementada (habilitada pelos módulos M4+).
export interface AtWizardStep {
  n: number;
  key: string;
  label: string;
  ready: boolean;
}
export const AT_WIZARD_STEPS: AtWizardStep[] = [
  { n: 1, key: "candidato", label: "Dados do candidato", ready: true },
  { n: 2, key: "curriculo", label: "Currículo", ready: true },
  { n: 3, key: "vaga", label: "Informações da vaga", ready: true },
  { n: 4, key: "plano", label: "Plano de aula", ready: true },
  { n: 5, key: "aula", label: "Aula-teste", ready: true },
  { n: 6, key: "didatica", label: "Avaliação da didática", ready: false },
  { n: 7, key: "dominio", label: "Domínio do conteúdo", ready: false },
  { n: 8, key: "alunos", label: "Avaliação dos alunos", ready: false },
  { n: 9, key: "pais", label: "Avaliação dos pais", ready: false },
  { n: 10, key: "professor", label: "Professor atual", ready: false },
  { n: 11, key: "comissao", label: "Comissão", ready: false },
  { n: 12, key: "parecer", label: "Parecer final", ready: false },
  { n: 13, key: "assinaturas", label: "Assinaturas", ready: false },
  { n: 14, key: "exportar", label: "Visualizar e exportar", ready: false },
];
export const AT_WIZARD_TOTAL = AT_WIZARD_STEPS.length;

export const atReportStatusLabel = (s: AtReportStatus) => AT_REPORT_STATUS_LABELS[s] ?? s;
export const atProcessStatusLabel = (s: AtProcessStatus) => AT_PROCESS_STATUS_LABELS[s] ?? s;
export const atEvaluationTypeLabel = (t: AtEvaluationType) => AT_EVALUATION_TYPE_LABELS[t] ?? t;
