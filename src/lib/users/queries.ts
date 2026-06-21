import "server-only";

// =============================================================================
// Consultas do módulo de Gestão de Usuários (somente perfis administrativos)
// =============================================================================
// A página chamadora é restrita a admin/diretor. A leitura usa o cliente
// administrativo para não depender de policies RLS antigas ou incompletas no
// banco remoto. A chave continua confinada ao servidor.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/models";

export interface ListUsersResult {
  users: Profile[];
  /** Mensagem de erro quando a busca falha. Diferencia "falhou ao carregar" de
   *  "não há usuários" — sem isso, uma falha faz a tela parecer vazia, como se
   *  os usuários tivessem sumido. */
  error: string | null;
}

export async function listUsers(): Promise<ListUsersResult> {
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return {
      users: [],
      error: error instanceof Error ? error.message : "Cliente administrativo indisponível.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listUsers: falha ao consultar profiles:", error.message);
    return { users: [], error: error.message };
  }

  return { users: data ?? [], error: null };
}
