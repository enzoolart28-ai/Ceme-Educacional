import "server-only";

// =============================================================================
// Consultas REAIS dos dashboards
// =============================================================================
// Fonte real disponível hoje: tabela `profiles`. As contagens respeitam a RLS
// (apenas staff enxerga todos os perfis). Métricas sem tabela ainda (turmas,
// receita, notas, frequência) vêm de src/lib/dashboard/mock.ts, separadas.
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type { ProfileStats } from "@/lib/dashboard/types";
import type { UserRole, UserStatus } from "@/types/models";

async function countProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: { role?: UserRole; status?: UserStatus } = {},
): Promise<number> {
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (filters.role) query = query.eq("role", filters.role);
  if (filters.status) query = query.eq("status", filters.status);

  const { count } = await query;
  return count ?? 0;
}

/** Contagens reais de usuários por papel/status (a partir de profiles). */
export async function getProfileStats(): Promise<ProfileStats> {
  const supabase = await createClient();

  const [activeStudents, teachers, coordinators, totalActiveUsers] =
    await Promise.all([
      countProfiles(supabase, { role: "aluno", status: "active" }),
      countProfiles(supabase, { role: "professor", status: "active" }),
      countProfiles(supabase, { role: "coordenacao", status: "active" }),
      countProfiles(supabase, { status: "active" }),
    ]);

  return { activeStudents, teachers, coordinators, totalActiveUsers };
}
