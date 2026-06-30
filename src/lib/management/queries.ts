import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCashFlowSummary, listCashSessions } from "@/lib/cash/queries";
import { getFinancialRequestSummary } from "@/lib/financial-requests/queries";

type UnknownRecord = Record<string, unknown>;

export interface ManagementMetric {
  label: string;
  value: number;
  kind?: "money" | "number" | "percent";
}

export interface ManagementDashboard {
  finance: ManagementMetric[];
  academic: ManagementMetric[];
  pedagogical: ManagementMetric[];
  commercial: ManagementMetric[];
  administrative: ManagementMetric[];
}

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface DepartmentGoalRow {
  id: string;
  departmentName: string;
  title: string;
  progress: number;
  status: string;
  endDate: string | null;
}

export interface ManagerReviewRow {
  id: string;
  departmentName: string | null;
  reviewType: string;
  status: string;
  notes: string | null;
  deadline: string | null;
  createdAt: string;
}

export interface ManagementAuditLogRow {
  id: string;
  actorName: string;
  action: string;
  entityType: string | null;
  createdAt: string;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function maybeStr(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function num(value: unknown): number {
  return Number(value ?? 0);
}

type CountQuery = PromiseLike<{ count: number | null }> & {
  eq: (key: string, value: unknown) => CountQuery;
};

type CountClient = {
  from: (table: string) => {
    select: (columns: string, options: { count: "exact"; head: true }) => CountQuery;
  };
};

async function count(table: string, filters: Record<string, unknown> = {}): Promise<number> {
  const supabase = await createClient();
  let query = (supabase as unknown as CountClient).from(table).select("*", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { count: total } = await query;
  return total ?? 0;
}

export async function getManagementDashboard(): Promise<ManagementDashboard> {
  const supabase = await createClient();
  const [cash, requests, sessions, students, enrollments, classes, teachers, documents, pendingAttendance, leads, events, registrations] =
    await Promise.all([
      getCashFlowSummary(),
      getFinancialRequestSummary(),
      listCashSessions(),
      count("students", { status: "active" }),
      count("class_students", { status: "active" }),
      count("classes", { status: "in_progress" }),
      count("teachers", { status: "active" }),
      count("documents", { status: "pendente" }),
      count("alerts", { type: "chamada_pendente" }),
      supabase.from("leads").select("status, source"),
      supabase.from("events").select("id,status"),
      supabase.from("event_registrations").select("converted_to_student"),
    ]);

  const leadRows = records(leads.data);
  const eventRows = records(events.data);
  const registrationRows = records(registrations.data);
  const convertedLeads = leadRows.filter((row) => row.status === "matriculado").length;
  const conversionRate = leadRows.length > 0 ? (convertedLeads / leadRows.length) * 100 : 0;

  return {
    finance: [
      { label: "Saldo atual em caixa", value: cash.finalBalance, kind: "money" },
      { label: "Entradas", value: cash.entries, kind: "money" },
      { label: "Saídas", value: cash.exits, kind: "money" },
      { label: "Solicitações pendentes", value: requests.pending },
      { label: "Solicitações aprovadas", value: requests.approved },
      { label: "Solicitações recusadas", value: requests.rejected },
      { label: "Caixas abertos", value: sessions.filter((s) => s.status === "open").length },
      { label: "Fechamentos com diferença", value: sessions.filter((s) => (s.difference ?? 0) !== 0).length },
    ],
    academic: [
      { label: "Alunos ativos", value: students },
      { label: "Matrículas", value: enrollments },
      { label: "Turmas ativas", value: classes },
      { label: "Professores ativos", value: teachers },
    ],
    pedagogical: [
      { label: "Professores sem chamada", value: pendingAttendance },
      { label: "Atividades pendentes", value: await count("student_assessment_submissions", { status: "submitted" }) },
      { label: "Conteúdos não publicados", value: await count("lessons", { status: "draft" }) },
    ],
    commercial: [
      { label: "Leads recebidos", value: leadRows.length },
      { label: "Leads em atendimento", value: leadRows.filter((row) => row.status === "em_atendimento").length },
      { label: "Leads convertidos", value: convertedLeads },
      { label: "Taxa de conversão", value: conversionRate, kind: "percent" },
      { label: "Eventos realizados", value: eventRows.filter((row) => row.status === "finalizado").length },
      { label: "Inscritos em eventos", value: registrationRows.length },
      { label: "Participantes convertidos", value: registrationRows.filter((row) => row.converted_to_student === true).length },
    ],
    administrative: [
      { label: "Documentos pendentes", value: documents },
      { label: "Solicitações internas abertas", value: requests.pending },
      { label: "Solicitações atrasadas", value: 0 },
    ],
  };
}

export async function listDepartments(): Promise<DepartmentOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("departments").select("id,name").order("name");
  return records(data).map((row) => ({ id: str(row.id), name: str(row.name) }));
}

export async function listDepartmentGoals(): Promise<DepartmentGoalRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("department_goals")
    .select("*, department:departments(name)")
    .order("created_at", { ascending: false });
  return records(data).map((row) => {
    const department = asRecord(row.department);
    return {
      id: str(row.id),
      departmentName: str(department.name, "-"),
      title: str(row.title),
      progress: num(row.progress_percentage),
      status: str(row.status),
      endDate: maybeStr(row.end_date),
    };
  });
}

export async function listManagerReviews(): Promise<ManagerReviewRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("manager_reviews")
    .select("*, department:departments(name)")
    .order("created_at", { ascending: false });
  return records(data).map((row) => {
    const department = asRecord(row.department);
    return {
      id: str(row.id),
      departmentName: maybeStr(department.name),
      reviewType: str(row.review_type),
      status: str(row.status),
      notes: maybeStr(row.notes),
      deadline: maybeStr(row.deadline),
      createdAt: str(row.created_at),
    };
  });
}

export async function listManagementAuditLogs(): Promise<ManagementAuditLogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("management_audit_logs")
    .select("id, action, entity_type, created_at, actor:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(80);

  return records(data).map((row) => {
    const actor = asRecord(row.actor);
    return {
      id: str(row.id),
      actorName: str(actor.full_name, "-"),
      action: str(row.action),
      entityType: maybeStr(row.entity_type),
      createdAt: str(row.created_at),
    };
  });
}
