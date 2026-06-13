import type { AnnouncementTarget, NotificationType } from "@/types/models";

// --- Público-alvo do comunicado ---------------------------------------------
export const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  all: "Todos",
  class: "Turma",
  course: "Curso",
  guardians: "Responsáveis",
  teachers: "Professores",
  user: "Usuário específico",
};

export const TARGET_BADGE: Record<AnnouncementTarget, string> = {
  all: "bg-indigo-100 text-indigo-800",
  class: "bg-sky-100 text-sky-800",
  course: "bg-violet-100 text-violet-800",
  guardians: "bg-amber-100 text-amber-800",
  teachers: "bg-emerald-100 text-emerald-800",
  user: "bg-slate-200 text-slate-700",
};

/** Opções de alvo conforme o que o usuário pode enviar. */
export function targetOptions(canSendGeneral: boolean) {
  const all = (Object.keys(TARGET_LABELS) as AnnouncementTarget[]).map((value) => ({
    value,
    label: TARGET_LABELS[value],
  }));
  // Professor (sem envio geral) só envia para turma.
  return canSendGeneral ? all : all.filter((o) => o.value === "class");
}

export const targetLabel = (t: AnnouncementTarget) => TARGET_LABELS[t] ?? t;

/** Alvos que exigem escolher um id específico (turma/curso/usuário). */
export const TARGETS_WITH_ID: AnnouncementTarget[] = ["class", "course", "user"];

// --- Notificações ------------------------------------------------------------
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  info: "Informação",
  success: "Sucesso",
  warning: "Atenção",
  announcement: "Comunicado",
  message: "Mensagem",
};

export const NOTIFICATION_TYPE_BADGE: Record<NotificationType, string> = {
  info: "bg-sky-100 text-sky-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  announcement: "bg-indigo-100 text-indigo-800",
  message: "bg-violet-100 text-violet-800",
};

export const notificationTypeLabel = (t: NotificationType) =>
  NOTIFICATION_TYPE_LABELS[t] ?? t;
