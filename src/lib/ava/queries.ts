import "server-only";

// =============================================================================
// Consultas do módulo AVA / EAD (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import { evaluateRelease } from "@/lib/ava/release";
import type {
  Lesson,
  LessonMaterial,
  LessonProgressStatus,
} from "@/types/models";

export interface LessonRow extends Lesson {
  materialCount: number;
}

export interface StudentLessonView {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  released: boolean;
  reason: string | null;
  progress: LessonProgressStatus;
}

export interface CourseProgress {
  total: number;
  completed: number;
  percent: number | null;
}

export interface StudentCourseView {
  lessons: StudentLessonView[];
  progress: CourseProgress;
}

async function studentIdByProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.id ?? null;
}

/** Cursos em que o aluno está matriculado (para a home do AVA do aluno). */
export async function listEnrolledCourses(
  profileId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("class:classes(course:courses(id, name))")
    .eq("student_id", profileId);

  const map = new Map<string, string>();
  for (const r of data ?? []) {
    const course = (r.class as { course: { id: string; name: string } | null } | null)?.course;
    if (course) map.set(course.id, course.name);
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

/** Aulas de um curso (gestão — inclui rascunhos via RLS de gestor). */
export async function listLessons(courseId: string): Promise<LessonRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select("*, lesson_materials(count)")
    .eq("course_id", courseId)
    .order("order_index");

  return (data ?? []).map((r) => {
    const row = r as typeof r & { lesson_materials: { count: number }[] };
    return { ...(row as unknown as Lesson), materialCount: row.lesson_materials?.[0]?.count ?? 0 };
  });
}

export async function getLessonById(id: string): Promise<
  (Lesson & { courseName: string }) | null
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select("*, course:courses(name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as typeof data & { course: { name: string } | null };
  return { ...(row as unknown as Lesson), courseName: row.course?.name ?? "—" };
}

export async function getLessonMaterials(lessonId: string): Promise<LessonMaterial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_materials")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("created_at");
  return data ?? [];
}

/** Visão do aluno de um curso: aulas publicadas + liberação + progresso. */
export async function getStudentCourseView(
  courseId: string,
  profileId: string,
): Promise<StudentCourseView> {
  const supabase = await createClient();
  const studentId = await studentIdByProfile(supabase, profileId);

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, description, release_type, release_date, order_index")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("order_index");

  const progressMap = new Map<string, LessonProgressStatus>();
  if (studentId) {
    const { data: progress } = await supabase
      .from("student_lesson_progress")
      .select("lesson_id, status")
      .eq("student_id", studentId);
    for (const p of progress ?? []) progressMap.set(p.lesson_id, p.status);
  }

  const now = new Date();
  let previousCompleted = true; // a primeira aula não tem anterior
  const result: StudentLessonView[] = [];
  let completed = 0;

  for (const l of lessons ?? []) {
    const prog = progressMap.get(l.id) ?? "not_started";
    if (prog === "completed") completed++;
    const rel = evaluateRelease(
      {
        id: l.id,
        release_type: l.release_type,
        release_date: l.release_date,
        previousCompleted,
      },
      now,
    );
    result.push({
      id: l.id,
      title: l.title,
      description: l.description,
      order_index: l.order_index,
      released: rel.released,
      reason: rel.reason,
      progress: prog,
    });
    previousCompleted = prog === "completed";
  }

  const total = result.length;
  return {
    lessons: result,
    progress: { total, completed, percent: total > 0 ? completed / total : null },
  };
}

/** Progresso consolidado do aluno (todas as aulas publicadas dos seus cursos). */
export async function getStudentProgressByProfile(profileId: string): Promise<CourseProgress> {
  const supabase = await createClient();
  const studentId = await studentIdByProfile(supabase, profileId);
  if (!studentId) return { total: 0, completed: 0, percent: null };

  const courses = await listEnrolledCourses(profileId);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return { total: 0, completed: 0, percent: null };

  const [{ count: total }, { data: completedRows }] = await Promise.all([
    supabase
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .in("course_id", courseIds)
      .eq("status", "published"),
    supabase
      .from("student_lesson_progress")
      .select("lesson_id, lesson:lessons!inner(course_id, status)")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .eq("lesson.status", "published")
      .in("lesson.course_id", courseIds),
  ]);

  const t = total ?? 0;
  const c = completedRows?.length ?? 0;
  return { total: t, completed: c, percent: t > 0 ? c / t : null };
}

/** Progresso consolidado de um aluno (por students.id) — usado pelo responsável. */
export async function getStudentProgressById(studentId: string): Promise<CourseProgress> {
  const supabase = await createClient();
  const { data: cs } = await supabase
    .from("class_students")
    .select("class:classes(course_id)")
    .eq("student_id", studentId)
    .eq("status", "active");
  const courseIds = Array.from(
    new Set(
      (cs ?? [])
        .map((r) => (r.class as { course_id: string } | null)?.course_id)
        .filter((x): x is string => !!x),
    ),
  );
  if (courseIds.length === 0) return { total: 0, completed: 0, percent: null };

  const [{ count: total }, { data: completedRows }] = await Promise.all([
    supabase
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .in("course_id", courseIds)
      .eq("status", "published"),
    supabase
      .from("student_lesson_progress")
      .select("lesson_id, lesson:lessons!inner(course_id, status)")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .eq("lesson.status", "published")
      .in("lesson.course_id", courseIds),
  ]);

  const t = total ?? 0;
  const c = completedRows?.length ?? 0;
  return { total: t, completed: c, percent: t > 0 ? c / t : null };
}
