// =============================================================================
// RBAC — definição central de perfis e rótulos
// =============================================================================
// Fonte única de verdade para os papéis. A matriz de permissões fica em
// permissions.ts (espelhando a tabela role_permissions do banco).
// =============================================================================
import type { UserRole, UserStatus } from "@/types/models";

/** Todos os perfis do sistema, na ordem hierárquica de exibição. */
export const ALL_ROLES: readonly UserRole[] = [
  "admin",
  "diretor",
  "coordenacao",
  "secretaria",
  "financeiro",
  "professor",
  "aluno",
  "responsavel",
] as const;

/** Rótulos amigáveis para exibição na interface. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  diretor: "Diretor",
  coordenacao: "Coordenação Pedagógica",
  secretaria: "Secretaria",
  financeiro: "Financeiro",
  professor: "Professor",
  aluno: "Aluno",
  responsavel: "Responsável",
};

/** Cor (classe Tailwind) usada em badges por perfil. */
export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800",
  diretor: "bg-purple-100 text-purple-800",
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

/** Rótulos de status da conta. */
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

/** Verdadeiro se o papel pertence ao conjunto informado. */
export function hasRole(
  role: UserRole | null | undefined,
  allowed: readonly UserRole[],
): boolean {
  return role != null && allowed.includes(role);
}

// -----------------------------------------------------------------------------
// Grupos de papéis reutilizáveis
// -----------------------------------------------------------------------------
export const STAFF_ROLES: readonly UserRole[] = [
  "admin",
  "diretor",
  "coordenacao",
  "secretaria",
];

export const MANAGEMENT_ROLES: readonly UserRole[] = ["admin", "diretor"];

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
