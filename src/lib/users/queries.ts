import "server-only";

// =============================================================================
// Consultas do módulo de Gestão de Usuários (somente perfis administrativos)
// =============================================================================
// Usa o cliente service_role (ignora RLS) — a página é gated por users.read /
// users.manage, então listar todos os perfis é o comportamento desejado.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/models";

export interface ListUsersResult {
  users: Profile[];
  /** Mensagem de erro quando a busca falha (ex.: chave de servidor inválida).
   *  Diferencia "falhou ao carregar" de "não há usuários" — sem isso, uma
   *  chave errada faz a tela parecer vazia, como se os usuários tivessem sumido. */
  error: string | null;
}

export async function listUsers(): Promise<ListUsersResult> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha ao iniciar o cliente administrativo.";
    console.error("listUsers: cliente admin indisponível:", message);
    return { users: [], error: message };
  }

  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listUsers: falha ao consultar profiles:", error.message);
    return { users: [], error: error.message };
  }

  return { users: data ?? [], error: null };
}
