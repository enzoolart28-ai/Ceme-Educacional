import "server-only";

// =============================================================================
// Helpers de sessão e autorização no SERVIDOR
// =============================================================================
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRole } from "@/lib/auth/roles";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import type { Profile, UserRole } from "@/types/models";

// Reexporta os grupos de papéis para uso direto nos guards de servidor.
export {
  STAFF_ROLES,
  MANAGEMENT_ROLES,
  ACADEMIC_ROLES,
  FINANCE_ROLES,
  GESTOR_ROLES,
  COMERCIAL_ROLES,
  REPORT_ROLES,
  ALL_ROLES,
} from "@/lib/auth/roles";

/** Usuário autenticado (verificado no servidor de auth) ou null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Perfil completo do usuário autenticado, ou null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data ?? null;
}

/**
 * Exige autenticação e conta ativa.
 * Redireciona para /login (não autenticado) ou /conta-inativa (status != active).
 * Não aplica o gate de onboarding — isso é feito no layout do dashboard para
 * evitar loop com a própria página de completar perfil.
 */
export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login");
  }
  if (profile.status !== "active") {
    redirect("/conta-inativa");
  }
  return profile;
}

/**
 * Exige autenticação E um dos papéis informados.
 * Redireciona para /login (não autenticado) ou /sem-permissao (sem papel).
 */
export async function requireRole(allowed: readonly UserRole[]): Promise<Profile> {
  const profile = await requireAuth();
  if (!hasRole(profile.role, allowed)) {
    redirect("/sem-permissao");
  }
  return profile;
}

/**
 * Exige autenticação E a permissão informada.
 * Redireciona para /sem-permissao se o papel não tiver a permissão.
 */
export async function requirePermission(permission: Permission): Promise<Profile> {
  const profile = await requireAuth();
  if (!hasPermission(profile.role, permission)) {
    redirect("/sem-permissao");
  }
  return profile;
}

/** Registra o último acesso do usuário autenticado (chamada via RPC). */
export async function recordLastAccess(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("record_last_access");
}
