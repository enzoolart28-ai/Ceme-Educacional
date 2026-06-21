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

export interface DependentGradeRow {
  id: string;
  assessmentName: string;
  subjectName: string;
  date: string | null;
  grade: number | null;
  maxGrade: number;
  feedback: string | null;
}

export interface DependentAcademicView {
  id: string;
  fullName: string;
  status: StudentStatus;
  courseName: string | null;
  className: string | null;
  observations: string | null;
  grades: DependentGradeRow[];
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

export async function getDependentAcademicView(
  profileId: string,
  studentId: string,
): Promise<DependentAcademicView | null> {
  const supabase = await createClient();
  const { data: guardian } = await supabase
    .from("guardians")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!guardian) return null;

  const { data: link } = await supabase
    .from("student_guardians")
    .select("id")
    .eq("guardian_id", guardian.id)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!link) return null;

  const [{ data: student }, { data: enrollment }, { data: gradeRows }] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, status, notes")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("class_students")
      .select("class:classes(name, course:courses(name))")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("grades")
      .select("id, grade, feedback, assessment:assessments(name, date, max_grade, subject:subjects(name))")
      .eq("student_id", studentId),
  ]);
  if (!student) return null;

  const classData = enrollment?.class as unknown as {
    name: string;
    course: { name: string } | null;
  } | null;
  const grades: DependentGradeRow[] = (gradeRows ?? []).map((row) => {
    const assessment = row.assessment as unknown as {
      name: string;
      date: string | null;
      max_grade: number;
      subject: { name: string } | null;
    } | null;
    return {
      id: row.id,
      assessmentName: assessment?.name ?? "Avaliacao",
      subjectName: assessment?.subject?.name ?? "Geral",
      date: assessment?.date ?? null,
      grade: row.grade == null ? null : Number(row.grade),
      maxGrade: Number(assessment?.max_grade ?? 10),
      feedback: row.feedback,
    };
  });

  return {
    id: student.id,
    fullName: student.full_name,
    status: student.status,
    courseName: classData?.course?.name ?? null,
    className: classData?.name ?? null,
    observations: student.notes,
    grades,
  };
}
