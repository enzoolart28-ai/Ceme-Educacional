import "server-only";

// =============================================================================
// Consultas do módulo de Alunos (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/students/cpf";
import type { Student, StudentStatus } from "@/types/models";

export interface StudentFilters {
  q?: string;
  status?: StudentStatus;
  classId?: string;
  courseId?: string;
}

export interface GuardianRow {
  id: string;
  is_financial_responsible: boolean;
  is_pedagogical_responsible: boolean;
  guardian: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    kinship: string | null;
  } | null;
}

/** Profiles de alunos matriculados numa turma (ou nas turmas de um curso). */
async function enrolledProfileIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: { classId?: string; courseId?: string },
): Promise<string[] | null> {
  if (filters.classId) {
    const { data } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("class_id", filters.classId);
    return (data ?? []).map((r) => r.student_id);
  }
  if (filters.courseId) {
    const { data: cls } = await supabase
      .from("classes")
      .select("id")
      .eq("course_id", filters.courseId);
    const classIds = (cls ?? []).map((c) => c.id);
    if (classIds.length === 0) return [];
    const { data } = await supabase
      .from("enrollments")
      .select("student_id")
      .in("class_id", classIds);
    return (data ?? []).map((r) => r.student_id);
  }
  return null; // sem filtro de turma/curso
}

export async function listStudents(filters: StudentFilters = {}): Promise<Student[]> {
  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select("*")
    .is("deleted_at", null)
    .order("full_name");

  if (filters.status) query = query.eq("status", filters.status);

  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim();
    const digits = onlyDigits(term);
    const parts = [`full_name.ilike.%${term}%`, `phone.ilike.%${term}%`];
    if (digits) parts.push(`cpf.ilike.%${digits}%`);
    query = query.or(parts.join(","));
  }

  const profileIds = await enrolledProfileIds(supabase, filters);
  if (profileIds !== null) {
    if (profileIds.length === 0) return [];
    query = query.in("profile_id", profileIds);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getStudentById(id: string): Promise<Student | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

/** Responsáveis vinculados a um aluno (recebe students.id). */
export async function getStudentGuardians(studentId: string): Promise<GuardianRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_guardians")
    .select(
      "id, is_financial_responsible, is_pedagogical_responsible, guardian:guardians(id, full_name, email, phone, kinship)",
    )
    .eq("student_id", studentId);

  return (data ?? []).map((row) => ({
    id: row.id,
    is_financial_responsible: row.is_financial_responsible,
    is_pedagogical_responsible: row.is_pedagogical_responsible,
    guardian:
      (row.guardian as GuardianRow["guardian"]) ?? null,
  }));
}
