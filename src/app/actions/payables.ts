"use server";

// =============================================================================
// Server Actions — Contas a Pagar (despesas)
// =============================================================================
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { payableSchema, payeeSchema, type PayableInput, type PayeeInput } from "@/lib/payables/schemas";
import type { ActionResult } from "@/app/actions/auth";
import type { PayableStatus } from "@/types/models";

async function canManage(): Promise<boolean> {
  const profile = await getProfile();
  return !!profile && hasPermission(profile.role, "finance.manage");
}

const BASE = "/dashboard/financeiro/contas-a-pagar";

// ---- Favorecidos -----------------------------------------------------------
export async function createPayeeAction(values: PayeeInput): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = payeeSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };

  const supabase = await createClient();
  const { error } = await supabase.from("payees").insert({
    name: parsed.data.name,
    type: parsed.data.type,
    pix_key: parsed.data.pix_key || null,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: "Não foi possível salvar o favorecido." };
  revalidatePath(`${BASE}/favorecidos`);
  revalidatePath(BASE);
  return { success: true };
}

export async function deactivatePayeeAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("payees").update({ active: false }).eq("id", id);
  if (error) return { error: "Não foi possível remover o favorecido." };
  revalidatePath(`${BASE}/favorecidos`);
  return { success: true };
}

// ---- Contas a pagar --------------------------------------------------------
export async function createPayableAction(values: PayableInput): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = payableSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  const profile = await getProfile();

  const supabase = await createClient();
  const { error } = await supabase.from("payables").insert({
    category_id: parsed.data.category_id,
    payee_id: parsed.data.payee_id || null,
    description: parsed.data.description,
    competence_month: parsed.data.competence_month,
    competence_year: parsed.data.competence_year,
    amount: parsed.data.amount,
    due_date: parsed.data.due_date || null,
    recurring: parsed.data.recurring ?? false,
    notes: parsed.data.notes || null,
    created_by: profile?.id ?? null,
  });
  if (error) return { error: "Não foi possível criar a conta." };
  revalidatePath(BASE);
  return { success: true };
}

export async function setPayableStatusAction(
  id: string,
  status: PayableStatus,
): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const paid_at = status === "pago" ? new Date().toISOString().slice(0, 10) : null;
  const { error } = await supabase.from("payables").update({ status, paid_at }).eq("id", id);
  if (error) return { error: "Não foi possível alterar o status." };
  revalidatePath(BASE);
  return { success: true };
}

export async function deletePayableAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("payables").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a conta." };
  revalidatePath(BASE);
  return { success: true };
}
