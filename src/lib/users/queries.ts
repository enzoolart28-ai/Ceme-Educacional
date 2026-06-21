import "server-only";

// =============================================================================
// Consultas do módulo de Gestão de Usuários (somente perfis administrativos)
// =============================================================================
// A LISTA usa o cliente de sessão (RLS), não o service_role: a página é restrita
// a admin/diretor, e o policy "profiles_select_self_or_staff" permite que staff
// leia todos os perfis. Assim a lista continua funcionando mesmo que a chave de
// servidor (SUPABASE_SERVICE_ROLE_KEY) esteja ausente/incorreta no ambiente.
// O service_role permanece apenas nas AÇÕES (criar/alterar/excluir login), que
// exigem a API de admin do Auth.
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/models";

export interface ListUsersResult {
  users: Profile[];
  /** Mensagem de erro quando a busca falha. Diferencia "falhou ao carregar" de
   *  "não há usuários" — sem isso, uma falha faz a tela parecer vazia, como se
   *  os usuários tivessem sumido. */
  error: string | null;
}

export async function listUsers(): Promise<ListUsersResult> {
  const supabase = await createClient();

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
