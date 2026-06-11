import "server-only";

// =============================================================================
// Consultas do módulo Acadêmico (dados reais, com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type {
  Class,
  Course,
  EnrollmentStatus,
  Subject,
} from "@/types/models";

export interface ClassWithMeta extends Class {
  courseName: string;
  studentCount: number;
}

export interface PersonOption {
  id: string;
  full_name: string;
  email: string;
}

export interface EnrollmentRow {
  id: string;
  status: EnrollmentStatus;
  student: PersonOption | null;
}

export interface AssignmentRow {
  id: string;
  teacher: PersonOption | null;
  subjectName: string | null;
}

// --- Catálogos ---------------------------------------------------------------
export async function listCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function listSubjects(): Promise<Subject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function listClasses(): Promise<ClassWithMeta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("*, course:courses(name), enrollments(count)")
    .order("year", { ascending: false })
    .order("name");

  return (data ?? []).map((row) => {
    const { course, enrollments, ...rest } = row as typeof row & {
      course: { name: string } | null;
      enrollments: { count: number }[];
    };
    return {
      ...(rest as Class),
      courseName: course?.name ?? "—",
      studentCount: enrollments?.[0]?.count ?? 0,
    };
  });
}

export async function getClassById(id: string): Promise<ClassWithMeta | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("*, course:courses(name), enrollments(count)")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const { course, enrollments, ...rest } = data as typeof data & {
    course: { name: string } | null;
    enrollments: { count: number }[];
  };
  return {
    ...(rest as Class),
    courseName: course?.name ?? "—",
    studentCount: enrollments?.[0]?.count ?? 0,
  };
}

// --- Listagens de uma turma --------------------------------------------------
export async function listEnrollments(classId: string): Promise<EnrollmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select(
      "id, status, student:profiles!enrollments_student_id_fkey(id, full_name, email)",
    )
    .eq("class_id", classId)
    .order("created_at");

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    student: (row.student as PersonOption | null) ?? null,
  }));
}

export async function listAssignments(classId: string): Promise<AssignmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_assignments")
    .select(
      "id, teacher:profiles!teacher_assignments_teacher_id_fkey(id, full_name, email), subject:subjects(name)",
    )
    .eq("class_id", classId)
    .order("created_at");

  return (data ?? []).map((row) => ({
    id: row.id,
    teacher: (row.teacher as PersonOption | null) ?? null,
    subjectName: (row.subject as { name: string } | null)?.name ?? null,
  }));
}

// --- Opções para formulários -------------------------------------------------
async function listProfilesByRole(role: "aluno" | "professor"): Promise<PersonOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", role)
    .eq("status", "active")
    .order("full_name");
  return (data as PersonOption[] | null) ?? [];
}

export function listStudents() {
  return listProfilesByRole("aluno");
}
export function listTeachers() {
  return listProfilesByRole("professor");
}

// --- Métricas para dashboards ------------------------------------------------
export interface AcademicCounts {
  courses: number;
  subjects: number;
  classes: number;
  enrollments: number;
}

export async function getAcademicCounts(): Promise<AcademicCounts> {
  const supabase = await createClient();
  const [courses, subjects, classes, enrollments] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subjects").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
    supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return {
    courses: courses.count ?? 0,
    subjects: subjects.count ?? 0,
    classes: classes.count ?? 0,
    enrollments: enrollments.count ?? 0,
  };
}

export interface StudentAcademic {
  courseName: string;
  className: string;
}

/** Turma/curso atuais do aluno (matrícula ativa). */
export async function getStudentAcademic(
  profileId: string,
): Promise<StudentAcademic | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("class:classes(name, course:courses(name))")
    .eq("student_id", profileId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const cls = data?.class as
    | { name: string; course: { name: string } | null }
    | null;
  if (!cls) return null;
  return { className: cls.name, courseName: cls.course?.name ?? "—" };
}

export interface TeacherAcademic {
  classCount: number;
  studentCount: number;
}

/** Quantidade de turmas que o professor leciona e total de alunos nelas. */
export async function getTeacherAcademic(
  profileId: string,
): Promise<TeacherAcademic> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_assignments")
    .select("class_id")
    .eq("teacher_id", profileId);

  const classIds = Array.from(new Set((data ?? []).map((r) => r.class_id)));
  if (classIds.length === 0) return { classCount: 0, studentCount: 0 };

  const { count } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .in("class_id", classIds);

  return { classCount: classIds.length, studentCount: count ?? 0 };
}
