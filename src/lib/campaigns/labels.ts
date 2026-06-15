import type {
  CampaignStatus,
  CampaignParticipantStatus,
  CampaignLevelDifficulty,
} from "@/types/models";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  rascunho: "Rascunho",
  ativa: "Ativa",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
};
export const CAMPAIGN_STATUS_BADGE: Record<CampaignStatus, string> = {
  rascunho: "bg-slate-200 text-slate-700",
  ativa: "bg-emerald-100 text-emerald-800",
  encerrada: "bg-amber-100 text-amber-800",
  cancelada: "bg-rose-100 text-rose-800",
};
export const CAMPAIGN_STATUS_OPTIONS = (
  Object.keys(CAMPAIGN_STATUS_LABELS) as CampaignStatus[]
).map((value) => ({ value, label: CAMPAIGN_STATUS_LABELS[value] }));

export const PARTICIPANT_STATUS_LABELS: Record<CampaignParticipantStatus, string> = {
  inscrito: "Inscrito",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  desistente: "Desistente",
};
export const PARTICIPANT_STATUS_BADGE: Record<CampaignParticipantStatus, string> = {
  inscrito: "bg-sky-100 text-sky-800",
  em_andamento: "bg-indigo-100 text-indigo-800",
  concluido: "bg-emerald-100 text-emerald-800",
  desistente: "bg-rose-100 text-rose-800",
};
export const PARTICIPANT_STATUS_OPTIONS = (
  Object.keys(PARTICIPANT_STATUS_LABELS) as CampaignParticipantStatus[]
).map((value) => ({ value, label: PARTICIPANT_STATUS_LABELS[value] }));

export const DIFFICULTY_LABELS: Record<CampaignLevelDifficulty, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};
export const DIFFICULTY_BADGE: Record<CampaignLevelDifficulty, string> = {
  facil: "bg-emerald-100 text-emerald-800",
  medio: "bg-amber-100 text-amber-800",
  dificil: "bg-rose-100 text-rose-800",
};
export const DIFFICULTY_OPTIONS = (
  Object.keys(DIFFICULTY_LABELS) as CampaignLevelDifficulty[]
).map((value) => ({ value, label: DIFFICULTY_LABELS[value] }));

export const campaignStatusLabel = (s: CampaignStatus) => CAMPAIGN_STATUS_LABELS[s] ?? s;
export const participantStatusLabel = (s: CampaignParticipantStatus) =>
  PARTICIPANT_STATUS_LABELS[s] ?? s;
export const difficultyLabel = (d: CampaignLevelDifficulty) => DIFFICULTY_LABELS[d] ?? d;
