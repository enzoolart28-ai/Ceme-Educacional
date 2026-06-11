import "server-only";

// =============================================================================
// Consultas do módulo de Professores (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/students/cpf";
import type { Teacher, TeacherStatus } from "@/types/models";

export interface TeacherFilters {
  q?: string;
  area?: string;
  status?: TeacherStatus;
}

export interface TeacherSubjectRow {
  id: string;
  subject: { id: string; name: string } | null;
}

export interface TeacherClassRow {
  id: string;
  class: { id: string; name: string; year: number } | null;
}

export interface TeacherHistoryRow {
  id: string;
  className: string;
  subjectName: string;
}

export async function listTeachers(filters: TeacherFilters = {}): Promise<Teacher[]> {
  const supabase = await createClient();
  let query = supabase.from("teachers").select("*").order("full_name");

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.area && filters.area.trim()) {
    query = query.ilike("expertise_area", `%${filters.area.trim()}%`);
  }
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim();
    const digits = onlyDigits(term);
    const parts = [`full_name.ilike.%${term}%`, `email.ilike.%${term}%`];
    if (digits) parts.push(`cpf.ilike.%${digits}%`);
    query = query.or(parts.join(","));
  }

  const { data } = await query;
  return data ?? [];
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function getTeacherSubjects(teacherId: string): Promise<TeacherSubjectRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_subjects")
    .select("id, subject:subjects(id, name)")
    .eq("teacher_id", teacherId);
  return (data ?? []).map((r) => ({
    id: r.id,
    subject: (r.subject as TeacherSubjectRow["subject"]) ?? null,
  }));
}

export async function getTeacherClasses(teacherId: string): Promise<TeacherClassRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_classes")
    .select("id, class:classes(id, name, year)")
    .eq("teacher_id", teacherId);
  return (data ?? []).map((r) => ({
    id: r.id,
    class: (r.class as TeacherClassRow["class"]) ?? null,
  }));
}

/** Histórico de atuação: disciplina × turma de fato (teacher_assignments). */
export async function getTeacherHistory(profileId: string): Promise<TeacherHistoryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_assignments")
    .select("id, class:classes(name), subject:subjects(name)")
    .eq("teacher_id", profileId);
  return (data ?? []).map((r) => ({
    id: r.id,
    className: (r.class as { name: string } | null)?.name ?? "—",
    subjectName: (r.subject as { name: string } | null)?.name ?? "—",
  }));
}
