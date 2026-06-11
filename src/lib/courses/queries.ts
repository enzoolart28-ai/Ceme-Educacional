import "server-only";

// =============================================================================
// Consultas do módulo de Cursos (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type {
  Course,
  CourseModality,
  CourseModule,
  CourseStatus,
  CourseType,
} from "@/types/models";

export interface CourseFilters {
  q?: string;
  modality?: CourseModality;
  type?: CourseType;
  status?: CourseStatus;
}

export interface CourseSubjectRow {
  id: string;
  order_index: number;
  workload_hours: number | null;
  module_id: string | null;
  subject: { id: string; name: string } | null;
  teacher: { id: string; full_name: string } | null;
}

export async function listCourses(filters: CourseFilters = {}): Promise<Course[]> {
  const supabase = await createClient();
  let query = supabase.from("courses").select("*").order("name");

  if (filters.modality) query = query.eq("modality", filters.modality);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q && filters.q.trim()) {
    query = query.ilike("name", `%${filters.q.trim()}%`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getCourseById(id: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function getCourseSubjects(courseId: string): Promise<CourseSubjectRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_subjects")
    .select(
      "id, order_index, workload_hours, module_id, subject:subjects(id, name), teacher:teachers(id, full_name)",
    )
    .eq("course_id", courseId)
    .order("order_index");
  return (data ?? []).map((r) => ({
    id: r.id,
    order_index: r.order_index,
    workload_hours: r.workload_hours,
    module_id: r.module_id,
    subject: (r.subject as CourseSubjectRow["subject"]) ?? null,
    teacher: (r.teacher as CourseSubjectRow["teacher"]) ?? null,
  }));
}

export async function getCourseModules(courseId: string): Promise<CourseModule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index");
  return data ?? [];
}
