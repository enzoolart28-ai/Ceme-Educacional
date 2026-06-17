import "server-only";

// =============================================================================
// Consultas do módulo de Gestão de Usuários (somente perfis administrativos)
// =============================================================================
// Usa o cliente service_role (ignora RLS) — a página é gated por users.read /
// users.manage, então listar todos os perfis é o comportamento desejado.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/models";

export async function listUsers(): Promise<Profile[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
