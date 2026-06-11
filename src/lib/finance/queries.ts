import "server-only";

import { createClient } from "@/lib/supabase/server";
import { INVOICE_STATUS, type InvoiceStatus, type PaymentMethod } from "@/lib/finance/labels";

type UnknownRecord = Record<string, unknown>;
type QueryResult = { data: unknown; error?: unknown };
type FinanceQuery = PromiseLike<QueryResult> & {
  select: (...args: unknown[]) => FinanceQuery;
  order: (...args: unknown[]) => FinanceQuery;
  eq: (...args: unknown[]) => FinanceQuery;
  gte: (...args: unknown[]) => FinanceQuery;
  lte: (...args: unknown[]) => FinanceQuery;
  maybeSingle: () => FinanceQuery;
};
type FinanceClient = {
  from: (table: string) => FinanceQuery;
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<QueryResult>;
};

export interface FinancialPlan {
  id: string;
  name: string;
  course_id: string | null;
  total_value: number;
  installments: number;
  due_day: number;
  discount_value: number;
  scholarship_percentage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialPlanRow extends FinancialPlan {
  courseName: string | null;
}

export interface FinanceEnrollmentOption {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  courseId: string;
  courseName: string;
  unitId: string | null;
  unitName: string | null;
}

export interface PaymentRow {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  paid_at: string;
  received_by: string | null;
  notes: string | null;
  created_at: string;
  receivedByName: string | null;
}

export interface InvoiceRow {
  id: string;
  student_id: string;
  plan_id: string | null;
  enrollment_id: string | null;
  course_id: string | null;
  class_id: string | null;
  original_value: number;
  discount_value: number;
  fine_value: number;
  interest_value: number;
  final_value: number;
  due_date: string;
  paid_at: string | null;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  studentName: string;
  courseName: string | null;
  className: string | null;
  unitId: string | null;
  unitName: string | null;
  payments: PaymentRow[];
  paidAmount: number;
  remainingAmount: number;
  latestPaymentMethod: PaymentMethod | null;
}

export interface InvoiceFilters {
  studentId?: string;
  courseId?: string;
  classId?: string;
  unitId?: string;
  status?: InvoiceStatus;
  dueFrom?: string;
  dueTo?: string;
}

export interface FinanceDashboardStats {
  openAmount: number;
  overdueAmount: number;
  receivedMonth: number;
  openCount: number;
  overdueCount: number;
  partialCount: number;
  paidCount: number;
}

export interface FinanceReports {
  byStatus: { status: InvoiceStatus; count: number; amount: number }[];
  byMethod: { method: PaymentMethod; count: number; amount: number }[];
  monthlyRevenue: { month: string; amount: number }[];
}

const statusSet = new Set<string>(INVOICE_STATUS);

function asMoney(value: unknown): number {
  return Number(value ?? 0);
}

function normalizeStatus(value: unknown): InvoiceStatus {
  return typeof value === "string" && statusSet.has(value) ? (value as InvoiceStatus) : "open";
}

async function financeClient(): Promise<FinanceClient> {
  const supabase = (await createClient()) as unknown as FinanceClient;
  await supabase.rpc("refresh_overdue_invoices");
  return supabase;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function asRecordArray(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map((item) => asRecord(item)) : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function mapPlan(input: unknown): FinancialPlanRow {
  const row = asRecord(input);
  const course = asRecord(row.course);
  return {
    id: asString(row.id),
    name: asString(row.name),
    course_id: asNullableString(row.course_id),
    total_value: asMoney(row.total_value),
    installments: Number(row.installments ?? 1),
    due_day: Number(row.due_day ?? 10),
    discount_value: asMoney(row.discount_value),
    scholarship_percentage: asMoney(row.scholarship_percentage),
    notes: asNullableString(row.notes),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    courseName: asNullableString(course.name),
  };
}

function mapPayment(input: unknown): PaymentRow {
  const row = asRecord(input);
  const receivedBy = asRecord(row.received_by_profile);
  return {
    id: asString(row.id),
    invoice_id: asString(row.invoice_id),
    amount: asMoney(row.amount),
    payment_method: row.payment_method as PaymentMethod,
    paid_at: asString(row.paid_at),
    received_by: asNullableString(row.received_by),
    notes: asNullableString(row.notes),
    created_at: asString(row.created_at),
    receivedByName: asNullableString(receivedBy.full_name),
  };
}

function mapInvoice(input: unknown): InvoiceRow {
  const row = asRecord(input);
  const payments = asRecordArray(row.payments)
    .map((payment) => mapPayment(payment))
    .sort((a: PaymentRow, b: PaymentRow) => b.paid_at.localeCompare(a.paid_at));
  const paidAmount = payments.reduce((sum: number, payment: PaymentRow) => sum + payment.amount, 0);
  const finalValue = asMoney(row.final_value);
  const student = asRecord(row.student);
  const course = asRecord(row.course);
  const classRow = asRecord(row.class);
  const unit = asRecord(classRow.unit);

  return {
    id: asString(row.id),
    student_id: asString(row.student_id),
    plan_id: asNullableString(row.plan_id),
    enrollment_id: asNullableString(row.enrollment_id),
    course_id: asNullableString(row.course_id),
    class_id: asNullableString(row.class_id),
    original_value: asMoney(row.original_value),
    discount_value: asMoney(row.discount_value),
    fine_value: asMoney(row.fine_value),
    interest_value: asMoney(row.interest_value),
    final_value: finalValue,
    due_date: asString(row.due_date),
    paid_at: asNullableString(row.paid_at),
    status: normalizeStatus(row.status),
    notes: asNullableString(row.notes),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
    studentName: asString(student.full_name, "—"),
    courseName: asNullableString(course.name),
    className: asNullableString(classRow.name),
    unitId: asNullableString(classRow.unit_id),
    unitName: asNullableString(unit.name),
    payments,
    paidAmount,
    remainingAmount: Math.max(finalValue - paidAmount, 0),
    latestPaymentMethod: payments[0]?.payment_method ?? null,
  };
}

export async function listFinancialPlans(): Promise<FinancialPlanRow[]> {
  const supabase = await financeClient();
  const { data } = await supabase
    .from("financial_plans")
    .select("*, course:courses(name)")
    .order("created_at", { ascending: false });
  return asRecordArray(data).map(mapPlan);
}

export async function getFinancialPlanById(id: string): Promise<FinancialPlanRow | null> {
  const supabase = await financeClient();
  const { data } = await supabase
    .from("financial_plans")
    .select("*, course:courses(name)")
    .eq("id", id)
    .maybeSingle();
  return data ? mapPlan(data) : null;
}

export async function listFinanceEnrollmentOptions(): Promise<FinanceEnrollmentOption[]> {
  const supabase = await financeClient();
  const { data } = await supabase
    .from("class_students")
    .select(
      "id, student:students(id, full_name), class:classes(id, name, course_id, unit_id, course:courses(id, name), unit:units(id, name))",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return asRecordArray(data)
    .map((row) => {
      const cls = asRecord(row.class);
      const course = asRecord(cls.course);
      const unit = asRecord(cls.unit);
      const student = asRecord(row.student);
      if (!cls.id || !course.id || !student.id) return null;
      return {
        id: asString(row.id),
        studentId: asString(student.id),
        studentName: asString(student.full_name),
        classId: asString(cls.id),
        className: asString(cls.name),
        courseId: asString(course.id),
        courseName: asString(course.name),
        unitId: asNullableString(unit.id) ?? asNullableString(cls.unit_id),
        unitName: asNullableString(unit.name),
      } satisfies FinanceEnrollmentOption;
    })
    .filter(Boolean) as FinanceEnrollmentOption[];
}

export async function listInvoices(filters: InvoiceFilters = {}): Promise<InvoiceRow[]> {
  const supabase = await financeClient();
  let query = supabase
    .from("invoices")
    .select(
      "*, student:students(id, full_name), course:courses(id, name), class:classes(id, name, unit_id, unit:units(id, name)), payments(*, received_by_profile:profiles(full_name))",
    )
    .order("due_date", { ascending: false });

  if (filters.studentId) query = query.eq("student_id", filters.studentId);
  if (filters.courseId) query = query.eq("course_id", filters.courseId);
  if (filters.classId) query = query.eq("class_id", filters.classId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.dueFrom) query = query.gte("due_date", filters.dueFrom);
  if (filters.dueTo) query = query.lte("due_date", filters.dueTo);

  const { data } = await query;
  let rows = asRecordArray(data).map(mapInvoice);
  if (filters.unitId) rows = rows.filter((row) => row.unitId === filters.unitId);
  return rows;
}

export async function getInvoiceById(id: string): Promise<InvoiceRow | null> {
  const supabase = await financeClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      "*, student:students(id, full_name), course:courses(id, name), class:classes(id, name, unit_id, unit:units(id, name)), payments(*, received_by_profile:profiles(full_name))",
    )
    .eq("id", id)
    .maybeSingle();
  return data ? mapInvoice(data) : null;
}

export async function getFinanceDashboardStats(): Promise<FinanceDashboardStats> {
  const invoices = await listInvoices();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return invoices.reduce<FinanceDashboardStats>(
    (stats, invoice) => {
      if (invoice.status === "open") {
        stats.openCount += 1;
        stats.openAmount += invoice.remainingAmount;
      }
      if (invoice.status === "overdue") {
        stats.overdueCount += 1;
        stats.overdueAmount += invoice.remainingAmount;
      }
      if (invoice.status === "partial") {
        stats.partialCount += 1;
        stats.openAmount += invoice.remainingAmount;
      }
      if (invoice.status === "paid") stats.paidCount += 1;

      for (const payment of invoice.payments) {
        if (payment.paid_at.startsWith(month)) stats.receivedMonth += payment.amount;
      }
      return stats;
    },
    {
      openAmount: 0,
      overdueAmount: 0,
      receivedMonth: 0,
      openCount: 0,
      overdueCount: 0,
      partialCount: 0,
      paidCount: 0,
    },
  );
}

export async function getFinanceReports(): Promise<FinanceReports> {
  const invoices = await listInvoices();
  const byStatusMap = new Map<InvoiceStatus, { status: InvoiceStatus; count: number; amount: number }>();
  const byMethodMap = new Map<PaymentMethod, { method: PaymentMethod; count: number; amount: number }>();
  const monthlyMap = new Map<string, number>();

  for (const invoice of invoices) {
    const statusRow =
      byStatusMap.get(invoice.status) ??
      { status: invoice.status, count: 0, amount: 0 };
    statusRow.count += 1;
    statusRow.amount += invoice.remainingAmount || invoice.final_value;
    byStatusMap.set(invoice.status, statusRow);

    for (const payment of invoice.payments) {
      const methodRow =
        byMethodMap.get(payment.payment_method) ??
        { method: payment.payment_method, count: 0, amount: 0 };
      methodRow.count += 1;
      methodRow.amount += payment.amount;
      byMethodMap.set(payment.payment_method, methodRow);

      const month = payment.paid_at.slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + payment.amount);
    }
  }

  return {
    byStatus: [...byStatusMap.values()],
    byMethod: [...byMethodMap.values()],
    monthlyRevenue: [...monthlyMap.entries()]
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}
