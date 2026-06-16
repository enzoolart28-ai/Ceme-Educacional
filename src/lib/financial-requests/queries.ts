import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UnknownRecord = Record<string, unknown>;

export interface FinancialRequestRow {
  id: string;
  title: string;
  description: string | null;
  requestedAmount: number;
  approvedAmount: number | null;
  requestDate: string;
  requiredDate: string | null;
  requesterName: string;
  departmentName: string | null;
  unitName: string | null;
  costCenterName: string | null;
  expenseCategory: string;
  beneficiaryName: string | null;
  desiredPaymentMethod: string;
  justification: string | null;
  priority: string;
  status: string;
  managerReason: string | null;
  paidAmount: number | null;
  paidAt: string | null;
  paymentProofUrl: string | null;
  createdAt: string;
}

export interface FinancialRequestSummary {
  pending: number;
  urgent: number;
  approved: number;
  rejected: number;
  paid: number;
  pendingAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  paidAmount: number;
}

type FinancialRequestStatus = Database["public"]["Enums"]["financial_request_status"];

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

function mapRequest(row: UnknownRecord): FinancialRequestRow {
  const requester = asRecord(row.requester);
  const department = asRecord(row.department);
  const unit = asRecord(row.unit);
  const costCenter = asRecord(row.cost_center);
  return {
    id: str(row.id),
    title: str(row.title),
    description: maybeStr(row.description),
    requestedAmount: num(row.requested_amount),
    approvedAmount: row.approved_amount == null ? null : num(row.approved_amount),
    requestDate: str(row.request_date),
    requiredDate: maybeStr(row.required_date),
    requesterName: str(requester.full_name, "-"),
    departmentName: maybeStr(department.name),
    unitName: maybeStr(unit.name),
    costCenterName: maybeStr(costCenter.name),
    expenseCategory: str(row.expense_category),
    beneficiaryName: maybeStr(row.beneficiary_name),
    desiredPaymentMethod: str(row.desired_payment_method),
    justification: maybeStr(row.justification),
    priority: str(row.priority),
    status: str(row.status),
    managerReason: maybeStr(row.manager_reason),
    paidAmount: row.paid_amount == null ? null : num(row.paid_amount),
    paidAt: maybeStr(row.paid_at),
    paymentProofUrl: maybeStr(row.payment_proof_url),
    createdAt: str(row.created_at),
  };
}

export async function listFinancialRequests(filters: { status?: FinancialRequestStatus } = {}): Promise<FinancialRequestRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("financial_requests")
    .select(
      "*, requester:profiles!financial_requests_requester_id_fkey(full_name), department:departments(name), unit:units(name), cost_center:cost_centers(name)",
    )
    .order("created_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  const { data } = await query;
  return records(data).map(mapRequest);
}

export async function getFinancialRequestById(id: string): Promise<FinancialRequestRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("financial_requests")
    .select(
      "*, requester:profiles!financial_requests_requester_id_fkey(full_name), department:departments(name), unit:units(name), cost_center:cost_centers(name)",
    )
    .eq("id", id)
    .maybeSingle();
  return data ? mapRequest(asRecord(data)) : null;
}

export async function getFinancialRequestSummary(): Promise<FinancialRequestSummary> {
  const rows = await listFinancialRequests();
  const pendingStatuses = new Set(["submitted", "under_review", "needs_information"]);
  return rows.reduce<FinancialRequestSummary>(
    (summary, row) => {
      if (pendingStatuses.has(row.status)) {
        summary.pending += 1;
        summary.pendingAmount += row.requestedAmount;
      }
      if (row.priority === "urgente" && pendingStatuses.has(row.status)) summary.urgent += 1;
      if (row.status === "approved" || row.status === "partially_approved") {
        summary.approved += 1;
        summary.approvedAmount += row.approvedAmount ?? row.requestedAmount;
      }
      if (row.status === "rejected") {
        summary.rejected += 1;
        summary.rejectedAmount += row.requestedAmount;
      }
      if (row.status === "paid") {
        summary.paid += 1;
        summary.paidAmount += row.paidAmount ?? 0;
      }
      return summary;
    },
    {
      pending: 0,
      urgent: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,
      paidAmount: 0,
    },
  );
}
