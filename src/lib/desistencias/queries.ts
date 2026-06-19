import "server-only";

// =============================================================================
// Relatório de Desistências (evasão) — alunos com status dropout/transferred
// =============================================================================
// Baseado no status do aluno (não exige tabela nova). Data aproximada da saída =
// updated_at; motivo = notes. Respeita RLS (gestão vê todos; professor escopo).
import { createClient } from "@/lib/supabase/server";
import type { StudentStatus } from "@/types/models";

export type DropoutType = "dropout" | "transferred";

export interface DropoutRow {
  id: string;
  studentName: string;
  status: StudentStatus;
  courseName: string | null;
  className: string | null;
  date: string; // updated_at (data aproximada da saída)
  reason: string | null;
}

export interface DropoutReport {
  rows: DropoutRow[];
  dropoutCount: number;
  transferredCount: number;
  totalStudents: number;
  rate: number; // % de desistência sobre o total de alunos não arquivados
  byCourse: { courseName: string; count: number }[];
}

export async function getDropoutReport(filters: { type?: DropoutType } = {}): Promise<DropoutReport> {
  const supabase = await createClient();

  const statuses: DropoutType[] = filters.type ? [filters.type] : ["dropout", "transferred"];

  const [{ data: studsData }, totalRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, status, notes, updated_at")
      .in("status", statuses)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    supabase.from("students").select("*", { count: "exact", head: true }).is("deleted_at", null),
  ]);
  const studs = studsData ?? [];
  const totalStudents = totalRes.count ?? 0;

  // Vincula curso/turma via class_students → classes → courses.
  const studentIds = studs.map((s) => s.id);
  let classMap = new Map<string, { className: string; courseId: string | null }>();
  let courseMap = new Map<string, string>();
  const studentToClass = new Map<string, string>();

  if (studentIds.length) {
    const { data: cs } = await supabase
      .from("class_students")
      .select("student_id, class_id")
      .in("student_id", studentIds);
    for (const r of cs ?? []) if (!studentToClass.has(r.student_id)) studentToClass.set(r.student_id, r.class_id);

    const classIds = [...new Set((cs ?? []).map((r) => r.class_id))];
    if (classIds.length) {
      const { data: classes } = await supabase.from("classes").select("id, name, course_id").in("id", classIds);
      classMap = new Map((classes ?? []).map((c) => [c.id, { className: c.name, courseId: c.course_id }]));
      const courseIds = [...new Set((classes ?? []).map((c) => c.course_id).filter((v): v is string => !!v))];
      if (courseIds.length) {
        const { data: courses } = await supabase.from("courses").select("id, name").in("id", courseIds);
        courseMap = new Map((courses ?? []).map((c) => [c.id, c.name]));
      }
    }
  }

  const rows: DropoutRow[] = studs.map((s) => {
    const classId = studentToClass.get(s.id);
    const cls = classId ? classMap.get(classId) : undefined;
    const courseName = cls?.courseId ? courseMap.get(cls.courseId) ?? null : null;
    return {
      id: s.id,
      studentName: s.full_name,
      status: s.status as StudentStatus,
      courseName,
      className: cls?.className ?? null,
      date: s.updated_at,
      reason: s.notes,
    };
  });

  const dropoutCount = rows.filter((r) => r.status === "dropout").length;
  const transferredCount = rows.filter((r) => r.status === "transferred").length;

  const courseTally = new Map<string, number>();
  for (const r of rows) {
    const key = r.courseName ?? "Sem curso";
    courseTally.set(key, (courseTally.get(key) ?? 0) + 1);
  }
  const byCourse = [...courseTally.entries()]
    .map(([courseName, count]) => ({ courseName, count }))
    .sort((a, b) => b.count - a.count);

  return {
    rows,
    dropoutCount,
    transferredCount,
    totalStudents,
    rate: totalStudents > 0 ? Math.round((dropoutCount / totalStudents) * 1000) / 10 : 0,
    byCourse,
  };
}
