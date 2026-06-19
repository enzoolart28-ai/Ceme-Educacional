import "server-only";

import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type {
  ReportChartItem,
  ReportFilters,
  ReportOptions,
  ReportSection,
  ReportsData,
} from "@/lib/reports/types";
import { allowedReportCategories } from "@/lib/reports/types";
import type { UserRole } from "@/types/models";

type UnknownRecord = Record<string, unknown>;
type QueryResult = { data: unknown; error?: unknown };
type ReportQuery = PromiseLike<QueryResult> & {
  select: (...args: unknown[]) => ReportQuery;
  order: (...args: unknown[]) => ReportQuery;
  eq: (...args: unknown[]) => ReportQuery;
  gte: (...args: unknown[]) => ReportQuery;
  lte: (...args: unknown[]) => ReportQuery;
};
type ReportsClient = {
  from: (table: string) => ReportQuery;
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<QueryResult>;
};

interface StudentClassRow {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  studentId: string;
  studentName: string;
  studentStatus: string;
  studentNotes: string | null;
  classId: string;
  className: string;
  classStatus: string;
  courseId: string | null;
  courseName: string;
  unitId: string | null;
  unitName: string;
}

interface AttendanceReportRow {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  courseId: string | null;
  unitId: string | null;
  date: string;
  status: string;
}

interface GradeReportRow {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  courseId: string | null;
  unitId: string | null;
  teacherName: string;
  assessmentName: string;
  assessmentDate: string | null;
  grade: number | null;
  maxGrade: number;
}

interface InvoiceReportRow {
  id: string;
  studentName: string;
  classId: string | null;
  className: string;
  courseId: string | null;
  courseName: string;
  unitId: string | null;
  unitName: string;
  originalValue: number;
  discountValue: number;
  fineValue: number;
  interestValue: number;
  finalValue: number;
  dueDate: string;
  status: string;
}

interface PaymentReportRow {
  amount: number;
  method: string;
  paidAt: string;
  invoiceId: string;
}

interface LessonReportRow {
  title: string;
  courseId: string | null;
  courseName: string;
  status: string;
  createdAt: string;
}

interface ProgressReportRow {
  studentId: string;
  studentName: string;
  lessonTitle: string;
  status: string;
  updatedAt: string;
  courseId: string | null;
}

interface LeadReportRow {
  source: string;
  status: string;
  course: string;
  createdAt: string;
}

interface EventReportRow {
  eventName: string;
  eventDate: string | null;
  registrations: number;
  attended: number;
  converted: number;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function asRecordArray(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableStr(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function num(value: unknown): number {
  return Number(value ?? 0);
}

function inRange(value: string | null | undefined, filters: ReportFilters): boolean {
  if (!value) return !filters.from && !filters.to;
  const date = value.slice(0, 10);
  if (filters.from && date < filters.from) return false;
  if (filters.to && date > filters.to) return false;
  return true;
}

function matchesCommon(
  row: {
    courseId?: string | null;
    classId?: string | null;
    unitId?: string | null;
    status?: string;
    studentStatus?: string;
    classStatus?: string;
  },
  filters: ReportFilters,
): boolean {
  if (filters.courseId && row.courseId !== filters.courseId) return false;
  if (filters.classId && row.classId !== filters.classId) return false;
  if (filters.unitId && row.unitId !== filters.unitId) return false;
  if (
    filters.status &&
    row.status !== filters.status &&
    row.studentStatus !== filters.status &&
    row.classStatus !== filters.status
  ) {
    return false;
  }
  return true;
}

function increment(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function topChart(map: Map<string, number>, limit = 8): ReportChartItem[] {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function section(
  input: Omit<ReportSection, "metrics"> & { metrics?: ReportSection["metrics"] },
): ReportSection {
  return { metrics: [], ...input };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(part: number, total: number): number {
  return total > 0 ? part / total : 0;
}

async function client(): Promise<ReportsClient> {
  return (await createClient()) as unknown as ReportsClient;
}

export async function getReportOptions(): Promise<ReportOptions> {
  const supabase = await client();
  const [{ data: courses }, { data: classes }, { data: units }] = await Promise.all([
    supabase.from("courses").select("id, name").order("name"),
    supabase.from("classes").select("id, name, course_id, unit_id").order("name"),
    supabase.from("units").select("id, name").order("name"),
  ]);

  return {
    courses: asRecordArray(courses).map((row) => ({
      id: str(row.id),
      name: str(row.name, "Curso sem nome"),
    })),
    classes: asRecordArray(classes).map((row) => ({
      id: str(row.id),
      name: str(row.name, "Turma sem nome"),
      courseId: nullableStr(row.course_id),
      unitId: nullableStr(row.unit_id),
    })),
    units: asRecordArray(units).map((row) => ({
      id: str(row.id),
      name: str(row.name, "Unidade sem nome"),
    })),
  };
}

function mapStudentClass(row: UnknownRecord): StudentClassRow {
  const student = asRecord(row.student);
  const cls = asRecord(row.class);
  const course = asRecord(cls.course);
  const unit = asRecord(cls.unit);
  return {
    id: str(row.id),
    status: str(row.status, "active"),
    createdAt: str(row.created_at),
    updatedAt: str(student.updated_at) || str(row.updated_at) || str(row.created_at),
    studentId: str(student.id),
    studentName: str(student.full_name, "Aluno sem nome"),
    studentStatus: str(student.status, "active"),
    studentNotes: nullableStr(student.notes),
    classId: str(cls.id),
    className: str(cls.name, "Turma sem nome"),
    classStatus: str(cls.status, "open"),
    courseId: nullableStr(cls.course_id) ?? nullableStr(course.id),
    courseName: str(course.name, "Curso sem nome"),
    unitId: nullableStr(cls.unit_id) ?? nullableStr(unit.id),
    unitName: str(unit.name, "Sem unidade"),
  };
}

function mapAttendance(row: UnknownRecord): AttendanceReportRow {
  const attendance = asRecord(row.attendance);
  const cls = asRecord(attendance.class);
  const course = asRecord(cls.course);
  const unit = asRecord(cls.unit);
  const student = asRecord(row.student);
  return {
    studentId: str(student.id),
    studentName: str(student.full_name, "Aluno sem nome"),
    classId: str(cls.id),
    className: str(cls.name, "Turma sem nome"),
    courseId: nullableStr(cls.course_id) ?? nullableStr(course.id),
    unitId: nullableStr(cls.unit_id) ?? nullableStr(unit.id),
    date: str(attendance.date),
    status: str(row.status),
  };
}

function mapGrade(row: UnknownRecord): GradeReportRow {
  const assessment = asRecord(row.assessment);
  const cls = asRecord(assessment.class);
  const teacher = asRecord(assessment.teacher);
  const teacherProfile = asRecord(teacher.profile);
  const student = asRecord(row.student);
  return {
    studentId: str(student.id),
    studentName: str(student.full_name, "Aluno sem nome"),
    classId: str(cls.id),
    className: str(cls.name, "Turma sem nome"),
    courseId: nullableStr(assessment.course_id) ?? nullableStr(cls.course_id),
    unitId: nullableStr(cls.unit_id),
    teacherName: str(teacherProfile.full_name, "Sem professor"),
    assessmentName: str(assessment.name, "Avaliacao"),
    assessmentDate: nullableStr(assessment.date),
    grade: row.grade == null ? null : num(row.grade),
    maxGrade: num(assessment.max_grade) || 10,
  };
}

function mapInvoice(row: UnknownRecord): InvoiceReportRow {
  const student = asRecord(row.student);
  const course = asRecord(row.course);
  const cls = asRecord(row.class);
  const unit = asRecord(cls.unit);
  return {
    id: str(row.id),
    studentName: str(student.full_name, "Aluno sem nome"),
    classId: nullableStr(row.class_id),
    className: str(cls.name, "Sem turma"),
    courseId: nullableStr(row.course_id),
    courseName: str(course.name, "Sem curso"),
    unitId: nullableStr(cls.unit_id) ?? nullableStr(unit.id),
    unitName: str(unit.name, "Sem unidade"),
    originalValue: num(row.original_value),
    discountValue: num(row.discount_value),
    fineValue: num(row.fine_value),
    interestValue: num(row.interest_value),
    finalValue: num(row.final_value),
    dueDate: str(row.due_date),
    status: str(row.status),
  };
}

function mapPayment(row: UnknownRecord): PaymentReportRow {
  return {
    amount: num(row.amount),
    method: str(row.payment_method),
    paidAt: str(row.paid_at),
    invoiceId: str(row.invoice_id),
  };
}

async function loadAcademic(filters: ReportFilters): Promise<{
  students: StudentClassRow[];
  attendance: AttendanceReportRow[];
  grades: GradeReportRow[];
}> {
  const supabase = await client();
  const [{ data: roster }, { data: attendance }, { data: grades }] = await Promise.all([
    supabase
      .from("class_students")
      .select(
        "id, status, created_at, updated_at, student:students(id, full_name, status, notes, updated_at), class:classes(id, name, status, course_id, unit_id, course:courses(id, name), unit:units(id, name))",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("attendance_records")
      .select(
        "status, student:students(id, full_name), attendance:attendance(date, class:classes(id, name, course_id, unit_id, course:courses(id, name), unit:units(id, name)))",
      ),
    supabase
      .from("grades")
      .select(
        "grade, student:students(id, full_name), assessment:assessments(name, date, max_grade, course_id, class:classes(id, name, course_id, unit_id), teacher:teachers(profile:profiles(full_name)))",
      ),
  ]);

  return {
    students: asRecordArray(roster)
      .map(mapStudentClass)
      .filter((row) => matchesCommon(row, filters) && inRange(row.createdAt, filters)),
    attendance: asRecordArray(attendance)
      .map(mapAttendance)
      .filter((row) => matchesCommon(row, filters) && inRange(row.date, filters)),
    grades: asRecordArray(grades)
      .map(mapGrade)
      .filter((row) => matchesCommon(row, filters) && inRange(row.assessmentDate, filters)),
  };
}

async function loadFinancial(filters: ReportFilters): Promise<{
  invoices: InvoiceReportRow[];
  payments: PaymentReportRow[];
}> {
  const supabase = await client();
  await supabase.rpc("refresh_overdue_invoices");
  const [{ data: invoices }, { data: payments }] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "*, student:students(full_name), course:courses(name), class:classes(name, unit_id, unit:units(id, name))",
      )
      .order("due_date", { ascending: false }),
    supabase.from("payments").select("*").order("paid_at", { ascending: false }),
  ]);

  return {
    invoices: asRecordArray(invoices)
      .map(mapInvoice)
      .filter((row) => matchesCommon(row, filters) && inRange(row.dueDate, filters)),
    payments: asRecordArray(payments)
      .map(mapPayment)
      .filter((row) => inRange(row.paidAt, filters)),
  };
}

async function loadPedagogical(filters: ReportFilters): Promise<{
  lessons: LessonReportRow[];
  progress: ProgressReportRow[];
  onlineAssessments: UnknownRecord[];
  submissions: UnknownRecord[];
  grades: GradeReportRow[];
  students: StudentClassRow[];
}> {
  const supabase = await client();
  const [academic, lessonsRes, progressRes, assessmentsRes, submissionsRes] = await Promise.all([
    loadAcademic(filters),
    supabase
      .from("lessons")
      .select("title, status, created_at, course_id, course:courses(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("student_lesson_progress")
      .select("status, updated_at, student:students(id, full_name), lesson:lessons(title, course_id)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("online_assessments")
      .select("title, status, start_date, end_date, class_id, course_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("student_assessment_submissions")
      .select("status, submitted_at, grade, assessment:online_assessments(class_id, course_id)"),
  ]);

  const lessons = asRecordArray(lessonsRes.data)
    .map((row): LessonReportRow => {
      const course = asRecord(row.course);
      return {
        title: str(row.title, "Aula sem titulo"),
        courseId: nullableStr(row.course_id),
        courseName: str(course.name, "Sem curso"),
        status: str(row.status),
        createdAt: str(row.created_at),
      };
    })
    .filter((row) => matchesCommon(row, filters) && inRange(row.createdAt, filters));

  const progress = asRecordArray(progressRes.data)
    .map((row): ProgressReportRow => {
      const student = asRecord(row.student);
      const lesson = asRecord(row.lesson);
      return {
        studentId: str(student.id),
        studentName: str(student.full_name, "Aluno sem nome"),
        lessonTitle: str(lesson.title, "Aula sem titulo"),
        status: str(row.status),
        updatedAt: str(row.updated_at),
        courseId: nullableStr(lesson.course_id),
      };
    })
    .filter((row) => matchesCommon(row, filters) && inRange(row.updatedAt, filters));

  return {
    lessons,
    progress,
    onlineAssessments: asRecordArray(assessmentsRes.data).filter((row) =>
      matchesCommon(
        {
          courseId: nullableStr(row.course_id),
          classId: nullableStr(row.class_id),
          status: str(row.status),
        },
        filters,
      ),
    ),
    submissions: asRecordArray(submissionsRes.data),
    grades: academic.grades,
    students: academic.students,
  };
}

async function loadCommercial(filters: ReportFilters): Promise<{
  leads: LeadReportRow[];
  events: EventReportRow[];
}> {
  const supabase = await client();
  const [{ data: leads }, { data: events }] = await Promise.all([
    supabase.from("leads").select("source, status, course_interest, created_at").order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("name, date, registrations:event_registrations(attended, converted_to_student)")
      .order("date", { ascending: false }),
  ]);

  return {
    leads: asRecordArray(leads)
      .map((row): LeadReportRow => ({
        source: str(row.source, "outro"),
        status: str(row.status, "novo"),
        course: str(row.course_interest, "Nao informado"),
        createdAt: str(row.created_at),
      }))
      .filter((row) => (!filters.status || row.status === filters.status) && inRange(row.createdAt, filters)),
    events: asRecordArray(events)
      .map((row): EventReportRow => {
        const regs = asRecordArray(row.registrations);
        return {
          eventName: str(row.name, "Evento sem nome"),
          eventDate: nullableStr(row.date),
          registrations: regs.length,
          attended: regs.filter((reg) => reg.attended === true).length,
          converted: regs.filter((reg) => reg.converted_to_student === true).length,
        };
      })
      .filter((row) => inRange(row.eventDate, filters)),
  };
}

function academicSections(data: Awaited<ReturnType<typeof loadAcademic>>): ReportSection[] {
  const activeStudents = data.students.filter((row) => row.status === "active" && row.studentStatus === "active");
  const courseMap = new Map<string, number>();
  const classMap = new Map<string, number>();
  const enrollmentMonthMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  for (const row of data.students) {
    increment(courseMap, row.courseName);
    increment(classMap, row.className);
    increment(enrollmentMonthMap, row.createdAt.slice(0, 7) || "Sem data");
    increment(statusMap, row.studentStatus);
  }

  const attendanceByStudent = new Map<string, { name: string; total: number; present: number }>();
  const attendanceByClass = new Map<string, { name: string; total: number; present: number }>();
  for (const row of data.attendance) {
    const present = row.status === "present" || row.status === "late";
    const s = attendanceByStudent.get(row.studentId) ?? { name: row.studentName, total: 0, present: 0 };
    s.total += 1;
    if (present) s.present += 1;
    attendanceByStudent.set(row.studentId, s);
    const c = attendanceByClass.get(row.classId) ?? { name: row.className, total: 0, present: 0 };
    c.total += 1;
    if (present) c.present += 1;
    attendanceByClass.set(row.classId, c);
  }

  const gradesByStudent = new Map<string, { name: string; values: number[] }>();
  const gradesByClass = new Map<string, { name: string; values: number[] }>();
  for (const row of data.grades) {
    if (row.grade == null) continue;
    const normalized = (row.grade / row.maxGrade) * 10;
    const s = gradesByStudent.get(row.studentId) ?? { name: row.studentName, values: [] };
    s.values.push(normalized);
    gradesByStudent.set(row.studentId, s);
    const c = gradesByClass.get(row.classId) ?? { name: row.className, values: [] };
    c.values.push(normalized);
    gradesByClass.set(row.classId, c);
  }

  const belowAverage = [...gradesByStudent.values()]
    .map((row) => ({ name: row.name, average: avg(row.values) }))
    .filter((row) => row.average < 6);
  const lowFrequency = [...attendanceByStudent.values()]
    .map((row) => ({ name: row.name, frequency: percent(row.present, row.total) }))
    .filter((row) => row.frequency < 0.75);

  return [
    section({
      id: "academic-overview",
      title: "Relatorios academicos",
      description: "Alunos ativos, distribuicao por curso/turma e matriculas por periodo.",
      category: "academic",
      metrics: [
        { label: "Alunos ativos", value: formatNumber(activeStudents.length) },
        { label: "Alunos evadidos", value: formatNumber(data.students.filter((s) => s.studentStatus === "dropout").length) },
        { label: "Alunos concluintes", value: formatNumber(data.students.filter((s) => s.studentStatus === "completed").length) },
      ],
      chart: topChart(courseMap),
      table: {
        id: "academic-students",
        title: "Alunos por curso e turma",
        description: "Lista de alunos filtrada por curso, turma, unidade, status e periodo de matricula.",
        columns: ["Aluno", "Curso", "Turma", "Unidade", "Status"],
        rows: data.students.map((row) => [row.studentName, row.courseName, row.className, row.unitName, row.studentStatus]),
      },
    }),
    section({
      id: "academic-enrollments",
      title: "Matriculas por periodo",
      description: "Volume de matriculas agrupado por mes.",
      category: "academic",
      chart: topChart(enrollmentMonthMap, 12),
      table: {
        id: "academic-enrollments-table",
        title: "Matriculas",
        description: "Meses com mais matriculas no periodo filtrado.",
        columns: ["Periodo", "Matriculas"],
        rows: [...enrollmentMonthMap.entries()].map(([month, total]) => [month, String(total)]),
      },
    }),
    section({
      id: "academic-frequency",
      title: "Frequencia",
      description: "Frequencia por aluno e por turma, com destaque para abaixo de 75%.",
      category: "academic",
      metrics: [{ label: "Abaixo de 75%", value: formatNumber(lowFrequency.length) }],
      chart: [...attendanceByClass.values()].map((row) => ({
        label: row.name,
        value: Math.round(percent(row.present, row.total) * 100),
      })),
      table: {
        id: "academic-frequency-table",
        title: "Frequencia por aluno",
        description: "Percentual calculado sobre chamadas registradas.",
        columns: ["Aluno", "Presencas", "Aulas", "Frequencia"],
        rows: [...attendanceByStudent.values()].map((row) => [
          row.name,
          String(row.present),
          String(row.total),
          formatPercent(percent(row.present, row.total)),
        ]),
      },
    }),
    section({
      id: "academic-grades",
      title: "Notas e desempenho",
      description: "Notas por aluno/turma e alunos abaixo da media.",
      category: "academic",
      metrics: [{ label: "Abaixo da media", value: formatNumber(belowAverage.length) }],
      chart: [...gradesByClass.values()].map((row) => ({ label: row.name, value: Number(avg(row.values).toFixed(1)) })),
      table: {
        id: "academic-grades-table",
        title: "Notas por aluno",
        description: "Media normalizada para escala de 0 a 10.",
        columns: ["Aluno", "Media", "Situacao"],
        rows: [...gradesByStudent.values()].map((row) => {
          const average = avg(row.values);
          return [row.name, average.toFixed(1), average < 6 ? "Abaixo da media" : "Regular"];
        }),
      },
    }),
  ];
}

function studentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    defaulter: "Inadimplente",
    locked: "Trancado",
    transferred: "Transferido",
    completed: "Concluido",
    dropout: "Desistente",
  };
  return labels[status] ?? status;
}

function dropoutSections(data: Awaited<ReturnType<typeof loadAcademic>>): ReportSection[] {
  const rows = data.students.filter((student) => student.studentStatus === "dropout" || student.studentStatus === "transferred");
  const dropoutCount = rows.filter((student) => student.studentStatus === "dropout").length;
  const transferredCount = rows.filter((student) => student.studentStatus === "transferred").length;
  const totalStudents = data.students.length;
  const byCourse = new Map<string, number>();
  const byStatus = new Map<string, number>();

  for (const row of rows) {
    increment(byCourse, row.courseName || "Sem curso");
    increment(byStatus, studentStatusLabel(row.studentStatus));
  }

  return [
    section({
      id: "dropout-overview",
      title: "Relatorio de desistencias",
      description: "Acompanhamento de evasao escolar, transferencias, curso, turma, data e motivo informado.",
      category: "dropout",
      metrics: [
        { label: "Desistentes", value: formatNumber(dropoutCount) },
        { label: "Transferidos", value: formatNumber(transferredCount) },
        { label: "Total de saidas", value: formatNumber(rows.length) },
        { label: "Taxa de desistencia", value: formatPercent(percent(dropoutCount, totalStudents)) },
      ],
      chart: topChart(byCourse),
      table: {
        id: "dropout-students-table",
        title: "Alunos desistentes e transferidos",
        description: "Lista filtrada por periodo, curso, turma, unidade e status do aluno.",
        columns: ["Aluno", "Situacao", "Curso", "Turma", "Unidade", "Data", "Motivo/observacao"],
        rows: rows.map((row) => [
          row.studentName,
          studentStatusLabel(row.studentStatus),
          row.courseName,
          row.className,
          row.unitName,
          row.updatedAt ? row.updatedAt.slice(0, 10) : "-",
          row.studentNotes ?? "-",
        ]),
      },
    }),
    section({
      id: "dropout-status-breakdown",
      title: "Resumo da evasao",
      description: "Distribuicao das saidas por situacao e taxa de desistencia sobre alunos filtrados.",
      category: "dropout",
      metrics: [
        { label: "Base filtrada", value: formatNumber(totalStudents) },
        { label: "Taxa de saida", value: formatPercent(percent(rows.length, totalStudents)) },
        { label: "Taxa de desistencia", value: formatPercent(percent(dropoutCount, totalStudents)) },
      ],
      chart: topChart(byStatus),
      table: {
        id: "dropout-course-table",
        title: "Saidas por curso",
        description: "Total de alunos desistentes ou transferidos agrupado por curso.",
        columns: ["Curso", "Saidas"],
        rows: [...byCourse.entries()].map(([course, total]) => [course, formatNumber(total)]),
      },
    }),
  ];
}

function financialSections(data: Awaited<ReturnType<typeof loadFinancial>>): ReportSection[] {
  const invoiceById = new Map(data.invoices.map((invoice) => [invoice.id, invoice]));
  const received = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const planned = data.invoices.reduce((sum, invoice) => sum + invoice.finalValue, 0);
  const overdue = data.invoices
    .filter((invoice) => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.finalValue, 0);
  const byMethod = new Map<string, number>();
  const byCourse = new Map<string, number>();
  const byUnit = new Map<string, number>();
  const byClass = new Map<string, number>();
  for (const payment of data.payments) {
    increment(byMethod, payment.method, payment.amount);
    const invoice = invoiceById.get(payment.invoiceId);
    if (invoice) {
      increment(byCourse, invoice.courseName, payment.amount);
      increment(byUnit, invoice.unitName, payment.amount);
      increment(byClass, invoice.className, payment.amount);
    }
  }

  return [
    section({
      id: "financial-overview",
      title: "Relatorios financeiros",
      description: "Receita prevista, recebida, inadimplencia, descontos, bolsas e renegociacoes.",
      category: "financial",
      metrics: [
        { label: "Receita prevista", value: formatCurrency(planned) },
        { label: "Receita recebida", value: formatCurrency(received) },
        { label: "Inadimplencia", value: formatCurrency(overdue) },
      ],
      chart: topChart(byCourse),
      table: {
        id: "financial-invoices-table",
        title: "Cobrancas",
        description: "Cobrancas filtradas por vencimento e status.",
        columns: ["Aluno", "Curso", "Turma", "Vencimento", "Status", "Valor"],
        rows: data.invoices.map((invoice) => [
          invoice.studentName,
          invoice.courseName,
          invoice.className,
          invoice.dueDate,
          invoice.status,
          formatCurrency(invoice.finalValue),
        ]),
      },
    }),
    section({
      id: "financial-payments",
      title: "Pagamentos por periodo e forma",
      description: "Recebimentos efetivos registrados no periodo.",
      category: "financial",
      chart: topChart(byMethod),
      table: {
        id: "financial-payments-table",
        title: "Pagamentos",
        description: "Pagamentos recebidos por forma de pagamento.",
        columns: ["Data", "Forma", "Valor"],
        rows: data.payments.map((payment) => [payment.paidAt.slice(0, 10), payment.method, formatCurrency(payment.amount)]),
      },
    }),
    section({
      id: "financial-breakdown",
      title: "Receita por unidade e turma",
      description: "Quebra da receita recebida por unidade e turma.",
      category: "financial",
      metrics: [
        { label: "Descontos", value: formatCurrency(data.invoices.reduce((sum, invoice) => sum + invoice.discountValue, 0)) },
        { label: "Bolsas", value: formatCurrency(data.invoices.reduce((sum, invoice) => sum + Math.max(invoice.originalValue - invoice.finalValue, 0), 0)) },
        { label: "Renegociacoes", value: formatNumber(data.invoices.filter((invoice) => invoice.status === "renegotiated").length) },
      ],
      chart: topChart(byUnit),
      table: {
        id: "financial-class-table",
        title: "Receita por turma",
        description: "Total recebido por turma no periodo.",
        columns: ["Turma", "Receita"],
        rows: [...byClass.entries()].map(([name, value]) => [name, formatCurrency(value)]),
      },
    }),
  ];
}

function pedagogicalSections(data: Awaited<ReturnType<typeof loadPedagogical>>): ReportSection[] {
  const byTeacher = new Map<string, number[]>();
  for (const grade of data.grades) {
    if (grade.grade == null) continue;
    const current = byTeacher.get(grade.teacherName) ?? [];
    current.push((grade.grade / grade.maxGrade) * 10);
    byTeacher.set(grade.teacherName, current);
  }
  const pendingActivities = data.onlineAssessments.filter((item) => str(item.status) === "published").length;
  const appliedTests = data.onlineAssessments.filter((item) => str(item.status) === "closed" || str(item.status) === "archived").length;
  const publishedContent = data.lessons.filter((lesson) => lesson.status === "published").length;
  const recentLimit = new Date();
  recentLimit.setDate(recentLimit.getDate() - 30);
  const recentlyActive = new Set(
    data.progress
      .filter((row) => new Date(row.updatedAt).getTime() >= recentLimit.getTime())
      .map((row) => row.studentId),
  );
  const withoutRecentAccess = data.students.filter((student) => !recentlyActive.has(student.studentId));

  return [
    section({
      id: "pedagogical-performance",
      title: "Relatorios pedagogicos",
      description: "Desempenho por turma e professor, atividades, provas e conteudos.",
      category: "pedagogical",
      metrics: [
        { label: "Atividades pendentes", value: formatNumber(pendingActivities) },
        { label: "Provas aplicadas", value: formatNumber(appliedTests) },
        { label: "Conteudos publicados", value: formatNumber(publishedContent) },
      ],
      chart: [...byTeacher.entries()].map(([teacher, values]) => ({ label: teacher, value: Number(avg(values).toFixed(1)) })),
      table: {
        id: "pedagogical-performance-table",
        title: "Desempenho por professor",
        description: "Media das notas lancadas por professor.",
        columns: ["Professor", "Media"],
        rows: [...byTeacher.entries()].map(([teacher, values]) => [teacher, avg(values).toFixed(1)]),
      },
    }),
    section({
      id: "pedagogical-ava",
      title: "AVA e acesso recente",
      description: "Conteudos publicados, progresso registrado e alunos sem acesso recente.",
      category: "pedagogical",
      metrics: [
        { label: "Acessos/progressos no AVA", value: formatNumber(data.progress.length) },
        { label: "Sem acesso recente", value: formatNumber(withoutRecentAccess.length) },
      ],
      chart: topChart(
        data.progress.reduce((map, row) => {
          increment(map, row.status);
          return map;
        }, new Map<string, number>()),
      ),
      table: {
        id: "pedagogical-ava-table",
        title: "Alunos sem acesso recente",
        description: "Alunos sem progresso atualizado no AVA nos ultimos 30 dias.",
        columns: ["Aluno", "Turma", "Curso"],
        rows: withoutRecentAccess.map((row) => [row.studentName, row.className, row.courseName]),
      },
    }),
  ];
}

function commercialSections(data: Awaited<ReturnType<typeof loadCommercial>>): ReportSection[] {
  const bySource = new Map<string, number>();
  const byCourse = new Map<string, number>();
  const byCampaign = new Map<string, number>();
  const converted = data.leads.filter((lead) => lead.status === "matriculado").length;
  for (const lead of data.leads) {
    increment(bySource, lead.source);
    increment(byCourse, lead.course);
    increment(byCampaign, lead.source, lead.status === "matriculado" ? 1 : 0);
  }

  return [
    section({
      id: "commercial-overview",
      title: "Relatorios comerciais",
      description: "Leads por origem/curso, conversao em matricula e eventos.",
      category: "commercial",
      metrics: [
        { label: "Leads", value: formatNumber(data.leads.length) },
        { label: "Conversoes", value: formatNumber(converted) },
        { label: "Taxa de conversao", value: formatPercent(percent(converted, data.leads.length)) },
      ],
      chart: topChart(bySource),
      table: {
        id: "commercial-leads-table",
        title: "Leads por origem e curso",
        description: "Distribuicao comercial por origem e interesse.",
        columns: ["Origem", "Curso", "Status"],
        rows: data.leads.map((lead) => [lead.source, lead.course, lead.status]),
      },
    }),
    section({
      id: "commercial-events",
      title: "Eventos e campanhas",
      description: "Eventos com mais inscritos e origens com melhor conversao.",
      category: "commercial",
      chart: data.events.map((event) => ({ label: event.eventName, value: event.registrations })),
      table: {
        id: "commercial-events-table",
        title: "Eventos",
        description: "Inscricoes, presencas e conversoes por evento.",
        columns: ["Evento", "Data", "Inscritos", "Presencas", "Conversoes"],
        rows: data.events.map((event) => [
          event.eventName,
          event.eventDate ?? "-",
          String(event.registrations),
          String(event.attended),
          String(event.converted),
        ]),
      },
      metrics: [
        {
          label: "Melhor campanha",
          value: topChart(byCampaign, 1)[0]?.label ?? "-",
          hint: "Origem com mais matriculas",
        },
        {
          label: "Curso mais procurado",
          value: topChart(byCourse, 1)[0]?.label ?? "-",
        },
      ],
    }),
  ];
}

export async function getReportsData(role: UserRole, filters: ReportFilters): Promise<ReportsData> {
  const categories = allowedReportCategories(role);
  const [options, academic, financial, pedagogical, commercial] = await Promise.all([
    getReportOptions(),
    categories.includes("academic") || categories.includes("dropout") ? loadAcademic(filters) : null,
    categories.includes("financial") ? loadFinancial(filters) : null,
    categories.includes("pedagogical") ? loadPedagogical(filters) : null,
    categories.includes("commercial") ? loadCommercial(filters) : null,
  ]);

  return {
    options,
    sections: [
      ...(academic ? academicSections(academic) : []),
      ...(academic && categories.includes("dropout") ? dropoutSections(academic) : []),
      ...(financial ? financialSections(financial) : []),
      ...(pedagogical ? pedagogicalSections(pedagogical) : []),
      ...(commercial ? commercialSections(commercial) : []),
    ],
  };
}
