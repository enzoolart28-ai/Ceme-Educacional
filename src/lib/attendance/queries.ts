import "server-only";

// =============================================================================
// Consultas do módulo de Chamada e Frequência (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import { computeFrequency, type FrequencySummary } from "@/lib/attendance/frequency";
import type {
  Attendance,
  AttendanceRecordStatus,
  AttendanceStatus,
} from "@/types/models";

export interface AttendanceSessionRow {
  id: string;
  date: string;
  status: AttendanceStatus;
  subjectName: string | null;
  recordCount: number;
}

export interface RosterEntry {
  studentId: string;
  fullName: string;
  status: AttendanceRecordStatus;
  observation: string;
}

export interface FrequencyRow {
  studentId: string;
  fullName: string;
  summary: FrequencySummary;
}

export async function listClassAttendances(classId: string): Promise<AttendanceSessionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance")
    .select("id, date, status, subject:subjects(name), attendance_records(count)")
    .eq("class_id", classId)
    .order("date", { ascending: false });

  return (data ?? []).map((r) => {
    const row = r as typeof r & {
      subject: { name: string } | null;
      attendance_records: { count: number }[];
    };
    return {
      id: row.id,
      date: row.date,
      status: row.status,
      subjectName: row.subject?.name ?? null,
      recordCount: row.attendance_records?.[0]?.count ?? 0,
    };
  });
}

export async function getAttendanceById(id: string): Promise<
  (Attendance & { subjectName: string | null; className: string }) | null
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance")
    .select("*, subject:subjects(name), class:classes(name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as typeof data & {
    subject: { name: string } | null;
    class: { name: string } | null;
  };
  return {
    ...(row as unknown as Attendance),
    subjectName: row.subject?.name ?? null,
    className: row.class?.name ?? "—",
  };
}

/** Roster da turma combinado com os registros já lançados (para a chamada). */
export async function getAttendanceRoster(
  attendanceId: string,
  classId: string,
): Promise<RosterEntry[]> {
  const supabase = await createClient();
  const [{ data: roster }, { data: records }] = await Promise.all([
    supabase
      .from("class_students")
      .select("student:students(id, full_name)")
      .eq("class_id", classId)
      .eq("status", "active"),
    supabase
      .from("attendance_records")
      .select("student_id, status, observation")
      .eq("attendance_id", attendanceId),
  ]);

  const recMap = new Map(
    (records ?? []).map((r) => [r.student_id, { status: r.status, observation: r.observation }]),
  );

  return (roster ?? [])
    .map((r) => (r.student as { id: string; full_name: string } | null))
    .filter((s): s is { id: string; full_name: string } => !!s)
    .map((s) => {
      const rec = recMap.get(s.id);
      return {
        studentId: s.id,
        fullName: s.full_name,
        status: (rec?.status as AttendanceRecordStatus) ?? "present",
        observation: rec?.observation ?? "",
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/** Disciplinas lecionadas na turma (para o seletor de nova chamada). */
export async function getClassAttendanceSubjects(
  classId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_assignments")
    .select("subject:subjects(id, name)")
    .eq("class_id", classId);

  const map = new Map<string, string>();
  for (const r of data ?? []) {
    const s = r.subject as { id: string; name: string } | null;
    if (s) map.set(s.id, s.name);
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

/** Relatório de frequência da turma (um resumo por aluno do roster). */
export async function getClassFrequencyReport(classId: string): Promise<FrequencyRow[]> {
  const supabase = await createClient();

  const [{ data: roster }, { data: records }] = await Promise.all([
    supabase
      .from("class_students")
      .select("student:students(id, full_name)")
      .eq("class_id", classId)
      .eq("status", "active"),
    supabase
      .from("attendance_records")
      .select("student_id, status, attendance:attendance!inner(date, class_id)")
      .eq("attendance.class_id", classId)
      .order("date", { ascending: true, referencedTable: "attendance" }),
  ]);

  const byStudent = new Map<string, AttendanceRecordStatus[]>();
  for (const r of records ?? []) {
    const list = byStudent.get(r.student_id) ?? [];
    list.push(r.status as AttendanceRecordStatus);
    byStudent.set(r.student_id, list);
  }

  return (roster ?? [])
    .map((r) => r.student as { id: string; full_name: string } | null)
    .filter((s): s is { id: string; full_name: string } => !!s)
    .map((s) => ({
      studentId: s.id,
      fullName: s.full_name,
      summary: computeFrequency(byStudent.get(s.id) ?? []),
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/** Resumo de frequência de um aluno (todas as turmas). Recebe students.id. */
export async function getStudentFrequency(studentId: string): Promise<FrequencySummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_records")
    .select("status, attendance:attendance(date)")
    .eq("student_id", studentId)
    .order("date", { ascending: true, referencedTable: "attendance" });

  const statuses = (data ?? []).map((r) => r.status as AttendanceRecordStatus);
  return computeFrequency(statuses);
}

/** Frequência do aluno a partir do PROFILE (para o painel do próprio aluno). */
export async function getStudentFrequencyByProfile(
  profileId: string,
): Promise<FrequencySummary | null> {
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!student) return null;
  return getStudentFrequency(student.id);
}
