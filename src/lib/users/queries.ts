import "server-only";

// =============================================================================
// Consultas do módulo de Gestão de Usuários (somente perfis administrativos)
// =============================================================================
// A página chamadora é restrita a admin/diretor.
//
// Estratégia resiliente para LISTAR perfis:
//   1) Tenta o cliente administrativo (service_role) — ignora RLS, vê tudo.
//   2) Se a chave de servidor estiver ausente/incorreta (ex.: foi colada a
//      chave anon por engano), o passo 1 volta vazio ou com erro. Então caímos
//      no cliente de SESSÃO (RLS): o policy "profiles_select_self_or_staff"
//      deixa staff ver todos os perfis, e a página já é restrita a admin/diretor.
//
// Assim a lista funciona mesmo com a chave de servidor mal configurada. As
// AÇÕES de criar/alterar/excluir login (em actions/users.ts) ainda exigem a
// chave de servidor correta, pois usam a API de admin do Auth.
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/models";

export interface ListUsersResult {
  users: Profile[];
  /** Mensagem de erro quando todas as tentativas falham. Diferencia "falhou ao
   *  carregar" de "não há usuários" — sem isso, uma falha faz a tela parecer
   *  vazia, como se os usuários tivessem sumido. */
  error: string | null;
}

export async function listUsers(): Promise<ListUsersResult> {
  // 1) Cliente administrativo (service_role).
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      return { users: data, error: null };
    }
  } catch {
    // Chave de servidor ausente/indisponível — cai no fallback de sessão.
  }

  // 2) Fallback: cliente de sessão (respeita RLS; admin/diretor veem todos).
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
