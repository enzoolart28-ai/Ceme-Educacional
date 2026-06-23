import "server-only";

// =============================================================================
// Consultas do módulo de Notas e Avaliações (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import {
  weightedAverage,
  situationFor,
  DEFAULT_MINIMUM_GRADE,
} from "@/lib/grades/calc";
import type { SituationStatus } from "@/lib/grades/labels";
import type { Assessment, AssessmentType } from "@/types/models";

export interface AssessmentRow extends Assessment {
  className: string;
  subjectName: string | null;
  gradeCount: number;
}

export interface GradeSheetEntry {
  studentId: string;
  fullName: string;
  grade: string; // string para input controlado ("" = sem nota)
  feedback: string;
}

export interface BoletimItem {
  id: string;
  name: string;
  type: AssessmentType;
  date: string | null;
  grade: number | null;
  maxGrade: number;
  weight: number;
}

export interface BoletimSubject {
  subjectId: string;
  subjectName: string;
  items: BoletimItem[];
  average: number | null;
  minGrade: number;
  situation: SituationStatus;
}

export async function listAssessments(filters: { classId?: string } = {}): Promise<AssessmentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("assessments")
    .select("*, class:classes(name), subject:subjects(name), grades(count)")
    .order("date", { ascending: false, nullsFirst: false });

  if (filters.classId) query = query.eq("class_id", filters.classId);

  const { data } = await query;
  return (data ?? []).map((r) => {
    const row = r as typeof r & {
      class: { name: string } | null;
      subject: { name: string } | null;
      grades: { count: number }[];
    };
    return {
      ...(row as unknown as Assessment),
      className: row.class?.name ?? "—",
      subjectName: row.subject?.name ?? null,
      gradeCount: row.grades?.[0]?.count ?? 0,
    };
  });
}

export async function getAssessmentById(id: string): Promise<
  (Assessment & { className: string; subjectName: string | null; minGrade: number }) | null
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("*, class:classes(name), subject:subjects(name), course:courses(minimum_grade)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as typeof data & {
    class: { name: string } | null;
    subject: { name: string } | null;
    course: { minimum_grade: number | null } | null;
  };
  return {
    ...(row as unknown as Assessment),
    className: row.class?.name ?? "—",
    subjectName: row.subject?.name ?? null,
    minGrade: row.course?.minimum_grade ?? DEFAULT_MINIMUM_GRADE,
  };
}

/** Planilha de lançamento: roster da turma + notas já lançadas. */
export async function getAssessmentGradeSheet(
  assessmentId: string,
  classId: string,
): Promise<GradeSheetEntry[]> {
  const supabase = await createClient();
  const [{ data: roster }, { data: grades }] = await Promise.all([
    supabase
      .from("class_students")
      .select("student:students(id, full_name)")
      .eq("class_id", classId)
      .eq("status", "active"),
    supabase
      .from("grades")
      .select("student_id, grade, feedback")
      .eq("assessment_id", assessmentId),
  ]);

  const gMap = new Map(
    (grades ?? []).map((g) => [g.student_id, { grade: g.grade, feedback: g.feedback }]),
  );

  return (roster ?? [])
    .map((r) => r.student as { id: string; full_name: string } | null)
    .filter((s): s is { id: string; full_name: string } => !!s)
    .map((s) => {
      const g = gMap.get(s.id);
      return {
        studentId: s.id,
        fullName: s.full_name,
        grade: g?.grade != null ? String(g.grade) : "",
        feedback: g?.feedback ?? "",
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/** Boletim do aluno: avaliações das suas turmas agrupadas por disciplina. */
export async function getStudentBoletim(studentId: string): Promise<BoletimSubject[]> {
  const supabase = await createClient();

  const { data: cs } = await supabase
    .from("class_students")
    .select("class_id")
    .eq("student_id", studentId)
    .eq("status", "active");
  const classIds = (cs ?? []).map((c) => c.class_id);
  if (classIds.length === 0) return [];

  const [{ data: assessments }, { data: grades }] = await Promise.all([
    supabase
      .from("assessments")
      .select(
        "id, name, type, date, weight, max_grade, subject:subjects(id, name), course:courses(minimum_grade)",
      )
      .in("class_id", classIds)
      .order("date", { ascending: true, nullsFirst: true }),
    supabase.from("grades").select("assessment_id, grade").eq("student_id", studentId),
  ]);

  const gradeMap = new Map((grades ?? []).map((g) => [g.assessment_id, g.grade]));

  const groups = new Map<string, BoletimSubject>();
  for (const a of assessments ?? []) {
    const subject = a.subject as { id: string; name: string } | null;
    const course = a.course as { minimum_grade: number | null } | null;
    const subjectId = subject?.id ?? "geral";
    const subjectName = subject?.name ?? "Geral";

    let group = groups.get(subjectId);
    if (!group) {
      group = {
        subjectId,
        subjectName,
        items: [],
        average: null,
        minGrade: course?.minimum_grade ?? DEFAULT_MINIMUM_GRADE,
        situation: "sem_nota",
      };
      groups.set(subjectId, group);
    }
    const grade = gradeMap.get(a.id);
    group.items.push({
      id: a.id,
      name: a.name,
      type: a.type as AssessmentType,
      date: a.date,
      grade: grade != null ? Number(grade) : null,
      maxGrade: Number(a.max_grade),
      weight: Number(a.weight),
    });
  }

  const result = [...groups.values()];
  for (const g of result) {
    g.average = weightedAverage(
      g.items.map((i) => ({ grade: i.grade, maxGrade: i.maxGrade, weight: i.weight })),
    );
    g.situation = situationFor(g.average, g.minGrade);
  }
  return result.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}

export async function getStudentBoletimByProfile(profileId: string): Promise<{
  studentId: string;
  fullName: string;
  subjects: BoletimSubject[];
} | null> {
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!student) return null;
  return {
    studentId: student.id,
    fullName: student.full_name,
    subjects: await getStudentBoletim(student.id),
  };
}

export interface RecentGrade {
  id: string;
  assessmentName: string;
  subjectName: string | null;
  grade: number;
  maxGrade: number;
}

/** Notas recentes do aluno (para o painel). */
export async function getStudentRecentGrades(studentId: string, limit = 5): Promise<RecentGrade[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("grades")
    .select("id, grade, assessment:assessments(name, max_grade, date, subject:subjects(name))")
    .eq("student_id", studentId)
    .not("grade", "is", null)
    .limit(limit);

  return (data ?? [])
    .map((g) => {
      const a = g.assessment as
        | { name: string; max_grade: number; date: string | null; subject: { name: string } | null }
        | null;
      return {
        id: g.id,
        assessmentName: a?.name ?? "—",
        subjectName: a?.subject?.name ?? null,
        grade: Number(g.grade),
        maxGrade: a?.max_grade != null ? Number(a.max_grade) : 10,
      };
    });
}

export async function getStudentRecentGradesByProfile(profileId: string): Promise<RecentGrade[]> {
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!student) return [];
  return getStudentRecentGrades(student.id);
}

// --- Diário de notas (planilha turma × alunos × avaliações) ------------------
export interface GradebookData {
  assessments: { id: string; name: string; maxGrade: number }[];
  students: { id: string; name: string }[];
  /** chave `${assessmentId}:${studentId}` -> nota (string; "" quando vazio). */
  grades: Record<string, string>;
}

/** Turmas que o usuário pode lançar notas (RLS: staff vê todas; professor as suas). */
export async function listGradebookClasses(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("classes").select("id, name").order("name");
  return data ?? [];
}

export async function getClassGradebook(classId: string): Promise<GradebookData> {
  const supabase = await createClient();

  const { data: aData } = await supabase
    .from("assessments")
    .select("id, name, max_grade, date, created_at")
    .eq("class_id", classId)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  const assessments = (aData ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    maxGrade: Number(a.max_grade) || 10,
  }));

  const { data: csData } = await supabase
    .from("class_students")
    .select("student:students(id, full_name)")
    .eq("class_id", classId);
  const students = (csData ?? [])
    .map((r) => {
      const s = (Array.isArray(r.student) ? r.student[0] : r.student) as
        | { id: string; full_name: string }
        | null;
      return s ? { id: s.id, name: s.full_name } : null;
    })
    .filter((s): s is { id: string; name: string } => s !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const grades: Record<string, string> = {};
  const assessmentIds = assessments.map((a) => a.id);
  if (assessmentIds.length > 0) {
    const { data: gData } = await supabase
      .from("grades")
      .select("assessment_id, student_id, grade")
      .in("assessment_id", assessmentIds);
    for (const g of gData ?? []) {
      grades[`${g.assessment_id}:${g.student_id}`] = g.grade != null ? String(g.grade) : "";
    }
  }

  return { assessments, students, grades };
}
