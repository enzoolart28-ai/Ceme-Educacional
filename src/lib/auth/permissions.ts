// =============================================================================
// RBAC — matriz de permissões (espelho de public.role_permissions)
// =============================================================================
// O banco é a fonte de verdade para RLS (função has_permission). Este módulo
// espelha a matriz para checagens rápidas na UI e nos guards de servidor, sem
// ida ao banco. Mantenha em sincronia com a migration de roles/permissions.
// =============================================================================
import type { UserRole } from "@/types/models";

export const PERMISSIONS = {
  PROFILE_SELF: "profile.self",
  USERS_READ: "users.read",
  USERS_MANAGE: "users.manage",
  ACADEMIC_READ: "academic.read",
  ACADEMIC_MANAGE: "academic.manage",
  COURSES_MANAGE: "courses.manage",
  CURRICULUM_MANAGE: "curriculum.manage",
  CLASSES_READ: "classes.read",
  CLASSES_MANAGE: "classes.manage",
  GRADES_READ: "grades.read",
  GRADES_MANAGE: "grades.manage",
  TEACHERS_READ: "teachers.read",
  TEACHERS_MANAGE: "teachers.manage",
  STUDENTS_READ: "students.read",
  STUDENTS_MANAGE: "students.manage",
  STUDENTS_OWN: "students.own",
  STUDENTS_LINKED: "students.linked",
  GUARDIANS_MANAGE: "guardians.manage",
  DOCUMENTS_READ: "documents.read",
  DOCUMENTS_MANAGE: "documents.manage",
  LEADS_MANAGE: "leads.manage",
  CAMPAIGNS_MANAGE: "campaigns.manage",
  ALERTS_MANAGE: "alerts.manage",
  AULATESTE_MANAGE: "aulateste.manage",
  AULATESTE_EVALUATE: "aulateste.evaluate",
  MANAGEMENT_READ: "management.read",
  MANAGEMENT_REVIEW: "management.review",
  MANAGEMENT_GOALS_MANAGE: "management.goals.manage",
  CASH_READ: "cash.read",
  CASH_MANAGE: "cash.manage",
  CASH_REVIEW: "cash.review",
  FINANCIAL_REQUESTS_CREATE: "financial_requests.create",
  FINANCIAL_REQUESTS_READ: "financial_requests.read",
  FINANCIAL_REQUESTS_APPROVE: "financial_requests.approve",
  FINANCIAL_REQUESTS_PAY: "financial_requests.pay",
  AUDIT_READ: "audit.read",
  FINANCE_READ: "finance.read",
  FINANCE_MANAGE: "finance.manage",
  REPORTS_READ: "reports.read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Matriz papel -> permissões. Deve refletir a migration role_permissions. */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: Object.values(PERMISSIONS), // admin tem todas
  diretor: [
    "profile.self",
    "reports.read",
    "users.read",
    "academic.read",
    "classes.read",
    "grades.read",
    "teachers.read",
    "documents.read",
    "finance.read",
    "finance.manage",
    "students.read",
    "students.manage",
    "courses.manage",
    "leads.manage",
    "alerts.manage",
    "aulateste.manage",
    "management.read",
    "management.review",
    "cash.read",
    "cash.review",
    "financial_requests.read",
    "financial_requests.approve",
    "audit.read",
  ],
  gestor: [
    "profile.self",
    "users.read",
    "reports.read",
    "management.read",
    "management.review",
    "management.goals.manage",
    "cash.read",
    "cash.review",
    "financial_requests.read",
    "financial_requests.approve",
    "alerts.manage",
    "audit.read",
    "finance.read",
    "academic.read",
    "classes.read",
    "grades.read",
    "teachers.read",
    "students.read",
    "documents.read",
    "leads.manage",
  ],
  coordenacao: [
    "profile.self",
    "reports.read",
    "academic.read",
    "courses.manage",
    "curriculum.manage",
    "classes.read",
    "classes.manage",
    "grades.read",
    "grades.manage",
    "teachers.read",
    "teachers.manage",
    "students.read",
    "students.manage",
    "guardians.manage",
    "leads.manage",
    "campaigns.manage",
    "alerts.manage",
    "aulateste.manage",
    "aulateste.evaluate",
    "financial_requests.create",
  ],
  // Aula-teste segue os perfis do spec (admin/diretor/coordenação/professor);
  // secretaria não participa deste subsistema.
  secretaria: [
    "profile.self",
    "reports.read",
    "academic.read",
    "academic.manage",
    "courses.manage",
    "documents.read",
    "documents.manage",
    "students.read",
    "students.manage",
    "guardians.manage",
    "classes.read",
    "finance.read",
    "leads.manage",
    "campaigns.manage",
    "alerts.manage",
    "financial_requests.create",
  ],
  financeiro: [
    "profile.self",
    "reports.read",
    "finance.read",
    "finance.manage",
    "alerts.manage",
    "cash.read",
    "cash.manage",
    "financial_requests.create",
    "financial_requests.read",
    "financial_requests.pay",
  ],
  professor: [
    "profile.self",
    "reports.read",
    "classes.read",
    "grades.read",
    "grades.manage",
    "students.read",
    "aulateste.evaluate",
    "financial_requests.create",
  ],
  aluno: [
    "profile.self",
    "students.own",
    "grades.read",
    "finance.read",
    "documents.read",
  ],
  responsavel: [
    "profile.self",
    "students.linked",
    "grades.read",
    "finance.read",
    "documents.read",
  ],
};

/** Verdadeiro se o papel possui a permissão (admin sempre tem todas). */
export function hasPermission(
  role: UserRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Verdadeiro se o papel possui ao menos uma das permissões. */
export function hasAnyPermission(
  role: UserRole | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** Verdadeiro se o papel possui todas as permissões. */
export function hasAllPermissions(
  role: UserRole | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}
