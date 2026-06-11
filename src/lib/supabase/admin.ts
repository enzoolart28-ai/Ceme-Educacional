import "server-only";

// =============================================================================
// Cliente Supabase ADMINISTRATIVO (service_role) — SOMENTE no servidor
// =============================================================================
// Ignora RLS. Use apenas em ações de servidor controladas (ex.: admin criando
// usuários). Nunca importe este módulo em Client Components.
// =============================================================================
import { createClient } from "@supabase/supabase-js";
import { env, getServiceRoleKey } from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    getServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
