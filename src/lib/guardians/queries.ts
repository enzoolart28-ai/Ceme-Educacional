import "server-only";

// =============================================================================
// Consultas do módulo de Responsáveis (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/students/cpf";
import type { Guardian, StudentStatus } from "@/types/models";

export interface GuardianStudentRow {
  id: string;
  is_financial_responsible: boolean;
  is_pedagogical_responsible: boolean;
  student: { id: string; full_name: string; status: StudentStatus } | null;
}

export async function listGuardians(q?: string): Promise<Guardian[]> {
  const supabase = await createClient();
  let query = supabase.from("guardians").select("*").order("full_name");

  if (q && q.trim()) {
    const term = q.trim();
    const digits = onlyDigits(term);
    const parts = [
      `full_name.ilike.%${term}%`,
      `phone.ilike.%${term}%`,
      `email.ilike.%${term}%`,
    ];
    if (digits) parts.push(`cpf.ilike.%${digits}%`);
    query = query.or(parts.join(","));
  }

  const { data } = await query;
  return data ?? [];
}

export async function getGuardianById(id: string): Promise<Guardian | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guardians")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

/** Alunos vinculados a um responsável. */
export async function getGuardianStudents(guardianId: string): Promise<GuardianStudentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_guardians")
    .select(
      "id, is_financial_responsible, is_pedagogical_responsible, student:students(id, full_name, status)",
    )
    .eq("guardian_id", guardianId);

  return (data ?? []).map((row) => ({
    id: row.id,
    is_financial_responsible: row.is_financial_responsible,
    is_pedagogical_responsible: row.is_pedagogical_responsible,
    student: (row.student as GuardianStudentRow["student"]) ?? null,
  }));
}

/** Alunos (ativos, não arquivados) para o seletor de vínculo. */
export async function listStudentsForLink(): Promise<
  { id: string; full_name: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, full_name")
    .is("deleted_at", null)
    .order("full_name");
  return data ?? [];
}

/** Dependentes (alunos) do responsável logado (painel próprio). */
export async function getDependents(profileId: string): Promise<GuardianStudentRow[]> {
  const supabase = await createClient();
  const { data: g } = await supabase
    .from("guardians")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!g) return [];
  return getGuardianStudents(g.id);
}
