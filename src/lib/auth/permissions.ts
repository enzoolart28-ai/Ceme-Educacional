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
  ],
  coordenacao: [
    "profile.self",
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
  ],
  secretaria: [
    "profile.self",
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
  ],
  financeiro: ["profile.self", "finance.read", "finance.manage"],
  professor: [
    "profile.self",
    "classes.read",
    "grades.read",
    "grades.manage",
    "students.read",
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
