import "server-only";

// =============================================================================
// Consultas de Disciplinas (subjects)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type { Subject } from "@/types/models";

export async function listSubjects(q?: string): Promise<Subject[]> {
  const supabase = await createClient();
  let query = supabase.from("subjects").select("*").order("name");
  if (q && q.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`);
  }
  const { data } = await query;
  return data ?? [];
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}
