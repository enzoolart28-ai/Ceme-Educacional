// =============================================================================
// <Can> — renderiza filhos apenas se o papel tiver a permissão
// =============================================================================
// Componente puro (sem hooks): funciona em Server e Client Components.
// Lembre-se: isto controla apenas a UI. A segurança real é garantida pelas
// políticas RLS no banco e pelos guards de servidor (requirePermission).
// =============================================================================
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/models";

export function Can({
  role,
  permission,
  fallback = null,
  children,
}: {
  role: UserRole | null | undefined;
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return <>{hasPermission(role, permission) ? children : fallback}</>;
}
