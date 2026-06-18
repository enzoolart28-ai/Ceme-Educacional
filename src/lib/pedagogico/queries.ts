import "server-only";

// =============================================================================
// Visão Pedagógica por turma: matrículas x limite + faltas (quem faltou)
// =============================================================================
// Usa o cliente normal (respeita RLS): coordenação/admin/diretor/secretaria veem
// todas as turmas; professor vê apenas as suas.
import { createClient } from "@/lib/supabase/server";
import type { ClassStatus } from "@/types/models";

export interface ClassAbsentee {
  studentId: string;
  studentName: string;
  faltas: number; // ausências (não justificadas + justificadas)
  justified: number;
  late: number;
}

export interface ClassPedagogical {
  id: string;
  name: string;
  courseName: string | null;
  unitName: string | null;
  shift: string | null;
  status: ClassStatus;
  maxStudents: number | null;
  enrolled: number;
  vagas: number | null;
  sessions: number;
  studentsWithAbsences: number;
  absentees: ClassAbsentee[];
}

export async function getClassesPedagogical(): Promise<ClassPedagogical[]> {
  const supabase = await createClient();

  const { data: classesData } = await supabase
    .from("classes")
    .select("id, name, course_id, unit_id, shift, status, max_students")
    .order("name");
  const classes = classesData ?? [];
  if (classes.length === 0) return [];

  const classIds = classes.map((c) => c.id);
  const courseIds = [...new Set(classes.map((c) => c.course_id).filter((v): v is string => !!v))];
  const unitIds = [...new Set(classes.map((c) => c.unit_id).filter((v): v is string => !!v))];

  const [courses, units, roster, sessions] = await Promise.all([
    courseIds.length
      ? supabase.from("courses").select("id, name").in("id", courseIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    unitIds.length
      ? supabase.from("units").select("id, name").in("id", unitIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from("class_students").select("class_id, student_id, status").in("class_id", classIds),
    supabase.from("attendance").select("id, class_id, status").in("class_id", classIds).eq("status", "finalized"),
  ]);

  const courseMap = new Map((courses.data ?? []).map((c) => [c.id, c.name]));
  const unitMap = new Map((units.data ?? []).map((u) => [u.id, u.name]));

  const sessionList = sessions.data ?? [];
  const sessionToClass = new Map(sessionList.map((s) => [s.id, s.class_id]));
  const sessionIds = sessionList.map((s) => s.id);

  const { data: recordsData } = sessionIds.length
    ? await supabase.from("attendance_records").select("attendance_id, student_id, status").in("attendance_id", sessionIds)
    : { data: [] as { attendance_id: string; student_id: string; status: string }[] };
  const records = recordsData ?? [];

  // Nomes dos alunos (roster + registros).
  const studentIds = [
    ...new Set([...roster.data ?? [], ...records].map((r) => ("student_id" in r ? r.student_id : ""))),
  ].filter(Boolean) as string[];
  const { data: studentsData } = studentIds.length
    ? await supabase.from("students").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string }[] };
  const studentMap = new Map((studentsData ?? []).map((s) => [s.id, s.full_name]));

  // Agrega ausências por turma + aluno.
  type Tally = { absent: number; justified: number; late: number };
  const byClass = new Map<string, Map<string, Tally>>();
  for (const r of records) {
    const classId = sessionToClass.get(r.attendance_id);
    if (!classId) continue;
    if (!byClass.has(classId)) byClass.set(classId, new Map());
    const m = byClass.get(classId)!;
    const t = m.get(r.student_id) ?? { absent: 0, justified: 0, late: 0 };
    if (r.status === "absent") t.absent += 1;
    else if (r.status === "justified_absence") t.justified += 1;
    else if (r.status === "late") t.late += 1;
    m.set(r.student_id, t);
  }

  return classes.map((c) => {
    const enrolled = (roster.data ?? []).filter((r) => r.class_id === c.id && r.status === "active").length;
    const sessionsCount = sessionList.filter((s) => s.class_id === c.id).length;
    const tallies = byClass.get(c.id) ?? new Map<string, Tally>();
    const absentees: ClassAbsentee[] = [...tallies.entries()]
      .map(([studentId, t]) => ({
        studentId,
        studentName: studentMap.get(studentId) ?? "Aluno",
        faltas: t.absent + t.justified,
        justified: t.justified,
        late: t.late,
      }))
      .filter((a) => a.faltas > 0)
      .sort((a, b) => b.faltas - a.faltas);

    return {
      id: c.id,
      name: c.name,
      courseName: c.course_id ? courseMap.get(c.course_id) ?? null : null,
      unitName: c.unit_id ? unitMap.get(c.unit_id) ?? null : null,
      shift: c.shift,
      status: c.status as ClassStatus,
      maxStudents: c.max_students,
      enrolled,
      vagas: c.max_students != null ? Math.max(c.max_students - enrolled, 0) : null,
      sessions: sessionsCount,
      studentsWithAbsences: absentees.length,
      absentees,
    };
  });
}
