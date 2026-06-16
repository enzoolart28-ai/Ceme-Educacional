"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  cashMovementSchema,
  closeCashSessionSchema,
  openCashSessionSchema,
  reviewCashSessionSchema,
} from "@/lib/cash/schemas";

function revalidateCash() {
  revalidatePath("/dashboard/financeiro/caixa");
  revalidatePath("/dashboard/financeiro/movimentacoes");
  revalidatePath("/dashboard/gestao");
  revalidatePath("/dashboard/gestao/fluxo-caixa");
  revalidatePath("/dashboard/gestao/conferencia-caixa");
}

async function requireCashManage() {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "cash.manage")) return null;
  return profile;
}

async function requireCashReview() {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "cash.review")) return null;
  return profile;
}

export async function openCashSessionAction(formData: FormData): Promise<void> {
  const profile = await requireCashManage();
  if (!profile) return;
  const parsed = openCashSessionSchema.safeParse({
    cashRegisterId: formData.get("cashRegisterId"),
    unitId: formData.get("unitId") ?? "",
    openingBalance: formData.get("openingBalance") ?? 0,
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("cash_sessions").insert({
    cash_register_id: parsed.data.cashRegisterId,
    unit_id: parsed.data.unitId || null,
    opening_balance: parsed.data.openingBalance,
    opened_by: profile.id,
    status: "open",
  });
  if (error) return;
  revalidateCash();
}

export async function createCashMovementAction(formData: FormData): Promise<void> {
  const profile = await requireCashManage();
  if (!profile) return;
  const parsed = cashMovementSchema.safeParse({
    cashSessionId: formData.get("cashSessionId"),
    movementType: formData.get("movementType"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    costCenterId: formData.get("costCenterId") ?? "",
    departmentId: formData.get("departmentId") ?? "",
    financialRequestId: formData.get("financialRequestId") ?? "",
    attachmentUrl: formData.get("attachmentUrl") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("cash_movements").insert({
    cash_session_id: parsed.data.cashSessionId,
    movement_type: parsed.data.movementType,
    category: parsed.data.category,
    description: parsed.data.description || null,
    amount: parsed.data.amount,
    payment_method: parsed.data.paymentMethod,
    cost_center_id: parsed.data.costCenterId || null,
    department_id: parsed.data.departmentId || null,
    financial_request_id: parsed.data.financialRequestId || null,
    attachment_url: parsed.data.attachmentUrl || null,
    created_by: profile.id,
    status: "completed",
  });
  if (error) return;
  revalidateCash();
}

export async function closeCashSessionAction(formData: FormData): Promise<void> {
  const profile = await requireCashManage();
  if (!profile) return;
  const parsed = closeCashSessionSchema.safeParse({
    cashSessionId: formData.get("cashSessionId"),
    informedClosingBalance: formData.get("informedClosingBalance"),
    differenceReason: formData.get("differenceReason") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: expectedData } = await supabase.rpc("cash_session_expected_balance", {
    p_session: parsed.data.cashSessionId,
  });
  const expected = Number(expectedData ?? 0);
  const difference = parsed.data.informedClosingBalance - expected;
  if (difference !== 0 && !parsed.data.differenceReason?.trim()) {
    return;
  }
  const status = difference === 0 ? "closed" : "with_difference";
  const { error } = await supabase
    .from("cash_sessions")
    .update({
      closed_by: profile.id,
      closed_at: new Date().toISOString(),
      expected_closing_balance: expected,
      informed_closing_balance: parsed.data.informedClosingBalance,
      difference,
      difference_reason: parsed.data.differenceReason || null,
      status,
    })
    .eq("id", parsed.data.cashSessionId);
  if (error) return;
  revalidateCash();
}

export async function reviewCashSessionAction(formData: FormData): Promise<void> {
  const profile = await requireCashReview();
  if (!profile) return;
  const parsed = reviewCashSessionSchema.safeParse({
    cashSessionId: formData.get("cashSessionId"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("cash_sessions")
    .update({
      status: parsed.data.status,
      manager_reviewed_by: profile.id,
      manager_reviewed_at: new Date().toISOString(),
      manager_review_notes: parsed.data.notes,
    })
    .eq("id", parsed.data.cashSessionId);
  if (error) return;
  revalidateCash();
}
