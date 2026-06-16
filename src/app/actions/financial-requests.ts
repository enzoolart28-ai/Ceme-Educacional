"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  financialRequestSchema,
  managerDecisionSchema,
  payFinancialRequestSchema,
} from "@/lib/financial-requests/schemas";

function revalidateRequests() {
  revalidatePath("/dashboard/financeiro/solicitacoes");
  revalidatePath("/dashboard/gestao/aprovacoes-financeiras");
  revalidatePath("/dashboard/gestao");
  revalidatePath("/dashboard/gestao/fluxo-caixa");
}

async function profileOrError() {
  return getProfile();
}

export async function createFinancialRequestAction(formData: FormData): Promise<void> {
  const profile = await profileOrError();
  if (!profile || !hasPermission(profile.role, "financial_requests.create")) {
    return;
  }
  const parsed = financialRequestSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    requestedAmount: formData.get("requestedAmount"),
    requiredDate: formData.get("requiredDate") ?? "",
    departmentId: formData.get("departmentId") ?? "",
    unitId: formData.get("unitId") ?? "",
    costCenterId: formData.get("costCenterId") ?? "",
    expenseCategory: formData.get("expenseCategory"),
    beneficiaryName: formData.get("beneficiaryName") ?? "",
    beneficiaryDocument: formData.get("beneficiaryDocument") ?? "",
    desiredPaymentMethod: formData.get("desiredPaymentMethod"),
    justification: formData.get("justification"),
    priority: formData.get("priority"),
    attachmentUrl: formData.get("attachmentUrl") ?? "",
    submit: formData.get("submit") === "true",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("financial_requests").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    requested_amount: parsed.data.requestedAmount,
    request_date: new Date().toISOString().slice(0, 10),
    required_date: parsed.data.requiredDate || null,
    requester_id: profile.id,
    department_id: parsed.data.departmentId || null,
    unit_id: parsed.data.unitId || null,
    cost_center_id: parsed.data.costCenterId || null,
    expense_category: parsed.data.expenseCategory,
    beneficiary_name: parsed.data.beneficiaryName || null,
    beneficiary_document: parsed.data.beneficiaryDocument || null,
    desired_payment_method: parsed.data.desiredPaymentMethod,
    justification: parsed.data.justification,
    priority: parsed.data.priority,
    attachment_url: parsed.data.attachmentUrl || null,
    status: parsed.data.submit ? "submitted" : "draft",
  });
  if (error) return;
  revalidateRequests();
}

export async function decideFinancialRequestAction(formData: FormData): Promise<void> {
  const profile = await profileOrError();
  if (!profile || !hasPermission(profile.role, "financial_requests.approve")) {
    return;
  }
  const parsed = managerDecisionSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    approvedAmount: formData.get("approvedAmount") || undefined,
    reason: formData.get("reason"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("financial_requests")
    .select("requester_id, requested_amount")
    .eq("id", parsed.data.requestId)
    .maybeSingle();
  if (!request) return;
  if (request.requester_id === profile.id && profile.role !== "admin" && profile.role !== "diretor") {
    return;
  }

  const statusByDecision = {
    approved: "approved",
    partially_approved: "partially_approved",
    rejected: "rejected",
    needs_information: "needs_information",
    returned_for_correction: "needs_information",
    forwarded_to_direction: "under_review",
  } as const;
  const approvedAmount =
    parsed.data.decision === "approved"
      ? Number(request.requested_amount)
      : parsed.data.decision === "partially_approved"
        ? parsed.data.approvedAmount
        : null;
  if (parsed.data.decision === "partially_approved" && (!approvedAmount || approvedAmount <= 0)) {
    return;
  }

  const { error } = await supabase
    .from("financial_requests")
    .update({
      manager_id: profile.id,
      manager_decision: parsed.data.decision,
      manager_reason: parsed.data.reason,
      manager_decision_at: new Date().toISOString(),
      approved_amount: approvedAmount,
      status: statusByDecision[parsed.data.decision],
    })
    .eq("id", parsed.data.requestId);
  if (error) return;
  revalidateRequests();
}

export async function payFinancialRequestAction(formData: FormData): Promise<void> {
  const profile = await profileOrError();
  if (!profile || !hasPermission(profile.role, "financial_requests.pay")) {
    return;
  }
  const parsed = payFinancialRequestSchema.safeParse({
    requestId: formData.get("requestId"),
    cashSessionId: formData.get("cashSessionId"),
    paidAmount: formData.get("paidAmount"),
    paymentMethod: formData.get("paymentMethod"),
    paymentProofUrl: formData.get("paymentProofUrl") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return;
  if (!parsed.data.paymentProofUrl) return;

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("financial_requests")
    .select("*")
    .eq("id", parsed.data.requestId)
    .maybeSingle();
  if (!request) return;
  if (!["approved", "partially_approved"].includes(request.status)) {
    return;
  }
  const approved = Number(request.approved_amount ?? 0);
  if (parsed.data.paidAmount > approved) {
    return;
  }

  const { error: movementError } = await supabase.from("cash_movements").insert({
    cash_session_id: parsed.data.cashSessionId,
    movement_type: "exit",
    category: request.expense_category,
    description: `Pagamento: ${request.title}`,
    amount: parsed.data.paidAmount,
    payment_method: parsed.data.paymentMethod,
    cost_center_id: request.cost_center_id,
    department_id: request.department_id,
    financial_request_id: parsed.data.requestId,
    attachment_url: parsed.data.paymentProofUrl,
    created_by: profile.id,
    status: "completed",
  });
  if (movementError) return;

  const { error } = await supabase
    .from("financial_requests")
    .update({
      paid_amount: parsed.data.paidAmount,
      paid_at: new Date().toISOString(),
      paid_by: profile.id,
      payment_proof_url: parsed.data.paymentProofUrl,
      status: "paid",
    })
    .eq("id", parsed.data.requestId);
  if (error) return;
  revalidateRequests();
  revalidatePath("/dashboard/financeiro/caixa");
}
