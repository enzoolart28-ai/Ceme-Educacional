// =============================================================================
// RBAC - definicao central de perfis e rotulos
// =============================================================================
import type { UserRole, UserStatus } from "@/types/models";

export const ALL_ROLES: readonly UserRole[] = [
  "admin",
  "diretor",
  "gestor",
  "comercial",
  "coordenacao",
  "secretaria",
  "financeiro",
  "professor",
  "aluno",
  "responsavel",
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  diretor: "Diretor",
  gestor: "Gestor",
  comercial: "Comercial",
  coordenacao: "Coordenacao Pedagogica",
  secretaria: "Secretaria",
  financeiro: "Financeiro",
  professor: "Professor",
  aluno: "Aluno",
  responsavel: "Responsavel",
};

export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800",
  diretor: "bg-purple-100 text-purple-800",
  gestor: "bg-cyan-100 text-cyan-800",
  comercial: "bg-lime-100 text-lime-800",
  coordenacao: "bg-indigo-100 text-indigo-800",
  secretaria: "bg-sky-100 text-sky-800",
  financeiro: "bg-emerald-100 text-emerald-800",
  professor: "bg-amber-100 text-amber-800",
  aluno: "bg-blue-100 text-blue-800",
  responsavel: "bg-teal-100 text-teal-800",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  suspended: "Suspenso",
  pending: "Pendente",
};

export const STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-700",
  suspended: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
};

export function statusLabel(status: UserStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function hasRole(
  role: UserRole | null | undefined,
  allowed: readonly UserRole[],
): boolean {
  return role != null && allowed.includes(role);
}

export const STAFF_ROLES: readonly UserRole[] = [
  "admin",
  "diretor",
  "coordenacao",
  "secretaria",
];

export const MANAGEMENT_ROLES: readonly UserRole[] = ["admin", "diretor"];

export const GESTOR_ROLES: readonly UserRole[] = ["admin", "diretor", "gestor"];

export const COMERCIAL_ROLES: readonly UserRole[] = [
  "admin",
  "diretor",
  "gestor",
  "coordenacao",
  "secretaria",
  "comercial",
  "financeiro",
];

export const ACADEMIC_ROLES: readonly UserRole[] = [
  "admin",
  "diretor",
  "coordenacao",
  "secretaria",
  "professor",
];

export const FINANCE_ROLES: readonly UserRole[] = [
  "admin",
  "diretor",
  "secretaria",
  "financeiro",
  "aluno",
  "responsavel",
];

export const REPORT_ROLES: readonly UserRole[] = [
  "admin",
  "diretor",
  "gestor",
  "coordenacao",
  "secretaria",
  "financeiro",
  "comercial",
  "professor",
];
