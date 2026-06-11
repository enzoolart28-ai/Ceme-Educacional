import "server-only";

// =============================================================================
// Consultas do módulo de Turmas (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type {
  Class,
  ClassShift,
  ClassStatus,
  ClassStudentStatus,
  Unit,
} from "@/types/models";

export interface ClassFilters {
  q?: string;
  courseId?: string;
  teacherId?: string;
  unitId?: string;
  shift?: ClassShift;
  status?: ClassStatus;
}

export interface ClassListRow extends Class {
  courseName: string;
  unitName: string | null;
  mainTeacherName: string | null;
  studentCount: number;
}

export interface RosterRow {
  id: string;
  status: ClassStudentStatus;
  student: { id: string; full_name: string } | null;
}

const SELECT =
  "*, course:courses(name), unit:units(name), main_teacher:teachers(full_name), class_students(count)";

function mapRow(row: Record<string, unknown>): ClassListRow {
  const { course, unit, main_teacher, class_students, ...rest } = row as typeof row & {
    course: { name: string } | null;
    unit: { name: string } | null;
    main_teacher: { full_name: string } | null;
    class_students: { count: number }[];
  };
  return {
    ...(rest as Class),
    courseName: course?.name ?? "—",
    unitName: unit?.name ?? null,
    mainTeacherName: main_teacher?.full_name ?? null,
    studentCount: class_students?.[0]?.count ?? 0,
  };
}

export async function listClasses(filters: ClassFilters = {}): Promise<ClassListRow[]> {
  const supabase = await createClient();
  let query = supabase.from("classes").select(SELECT).order("name");

  if (filters.courseId) query = query.eq("course_id", filters.courseId);
  if (filters.teacherId) query = query.eq("main_teacher_id", filters.teacherId);
  if (filters.unitId) query = query.eq("unit_id", filters.unitId);
  if (filters.shift) query = query.eq("shift", filters.shift);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q && filters.q.trim()) query = query.ilike("name", `%${filters.q.trim()}%`);

  const { data } = await query;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function getClassById(id: string): Promise<ClassListRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("classes").select(SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function listRoster(classId: string): Promise<RosterRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_students")
    .select("id, status, student:students(id, full_name)")
    .eq("class_id", classId)
    .order("created_at");
  return (data ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    student: (r.student as RosterRow["student"]) ?? null,
  }));
}

export async function listUnits(): Promise<Unit[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("units").select("*").order("name");
  return data ?? [];
}
