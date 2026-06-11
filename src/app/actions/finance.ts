"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  cancelInvoiceSchema,
  financialPlanSchema,
  generateInvoicesSchema,
  invoiceAdjustmentSchema,
  paymentSchema,
  renegotiationSchema,
  type CancelInvoiceInput,
  type FinancialPlanInput,
  type GenerateInvoicesInput,
  type InvoiceAdjustmentInput,
  type PaymentInput,
  type RenegotiationInput,
} from "@/lib/finance/schemas";
import type { ActionResult } from "@/app/actions/auth";

type DbError = { code?: string; message?: string };
type QueryResult = { data: unknown; error: DbError | null };
type FinanceQuery = PromiseLike<QueryResult> & {
  insert: (values: unknown) => FinanceQuery;
  update: (values: unknown) => FinanceQuery;
  delete: () => FinanceQuery;
  select: (...args: unknown[]) => FinanceQuery;
  eq: (...args: unknown[]) => FinanceQuery;
  maybeSingle: () => FinanceQuery;
  single: () => FinanceQuery;
};
type FinanceClient = {
  from: (table: string) => FinanceQuery;
};

async function canManageFinance(): Promise<boolean> {
  const profile = await getProfile();
  return !!profile && hasPermission(profile.role, "finance.manage");
}

async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}

async function financeClient(): Promise<FinanceClient> {
  return (await createClient()) as unknown as FinanceClient;
}

function toNumber(value?: string): number {
  return Number((value || "0").replace(",", "."));
}

function nullableText(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  return copy;
}

function dueDateFor(month: Date, dueDay: number): string {
  const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), dueDay));
  return date.toISOString().slice(0, 10);
}

function planPayload(values: FinancialPlanInput) {
  return {
    name: values.name,
    course_id: values.course_id || null,
    total_value: toNumber(values.total_value),
    installments: Number(values.installments),
    due_day: Number(values.due_day),
    discount_value: toNumber(values.discount_value),
    scholarship_percentage: toNumber(values.scholarship_percentage),
    notes: nullableText(values.notes),
  };
}

async function logInvoiceAction(
  invoiceId: string,
  action: string,
  metadata: Record<string, unknown>,
) {
  const profile = await getProfile();
  const supabase = await financeClient();
  await supabase.from("financial_logs").insert({
    invoice_id: invoiceId,
    actor_id: profile?.id ?? null,
    action,
    metadata,
  });
}

export async function createFinancialPlanAction(
  values: FinancialPlanInput,
): Promise<ActionResult> {
  if (!(await canManageFinance())) {
    return { error: "Você não tem permissão para gerenciar o financeiro." };
  }

  const parsed = financialPlanSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do plano." };

  const supabase = await financeClient();
  const { data, error } = await supabase
    .from("financial_plans")
    .insert(planPayload(parsed.data))
    .select("id")
    .single();

  if (error) return { error: "Não foi possível criar o plano financeiro." };

  const planId = asString(asRecord(data).id);
  if (!planId) return { error: "Plano criado, mas não foi possível abrir a edição." };

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/planos");
  redirect(`/dashboard/financeiro/planos/${planId}/editar`);
}

export async function updateFinancialPlanAction(
  id: string,
  values: FinancialPlanInput,
): Promise<ActionResult> {
  if (!(await canManageFinance())) {
    return { error: "Você não tem permissão para gerenciar o financeiro." };
  }

  const parsed = financialPlanSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do plano." };

  const supabase = await financeClient();
  const { error } = await supabase
    .from("financial_plans")
    .update(planPayload(parsed.data))
    .eq("id", id);

  if (error) return { error: "Não foi possível salvar o plano financeiro." };

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/planos");
  redirect("/dashboard/financeiro/planos");
}

export async function deleteFinancialPlanAction(id: string): Promise<ActionResult> {
  if (!(await canManageFinance())) {
    return { error: "Você não tem permissão para gerenciar o financeiro." };
  }

  const supabase = await financeClient();
  const { error } = await supabase.from("financial_plans").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o plano financeiro." };

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/planos");
  redirect("/dashboard/financeiro/planos");
}

export async function generateInvoicesAction(
  values: GenerateInvoicesInput,
): Promise<ActionResult> {
  if (!(await canManageFinance())) {
    return { error: "Você não tem permissão para gerar mensalidades." };
  }

  const parsed = generateInvoicesSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os dados para geração." };

  const supabase = await financeClient();
  const [{ data: planData }, { data: enrollmentData }] = await Promise.all([
    supabase.from("financial_plans").select("*").eq("id", parsed.data.plan_id).maybeSingle(),
    supabase
      .from("class_students")
      .select("id, student_id, class_id, class:classes(id, course_id)")
      .eq("id", parsed.data.enrollment_id)
      .maybeSingle(),
  ]);

  const plan = asRecord(planData);
  const enrollment = asRecord(enrollmentData);
  const enrollmentClass = asRecord(enrollment.class);

  if (!plan.id || !enrollment.id || !enrollmentClass.course_id) {
    return { error: "Plano ou matrícula não encontrados." };
  }

  const installments = Number(plan.installments);
  const originalPerInstallment = Number(plan.total_value) / installments;
  const fixedDiscount = Number(plan.discount_value ?? 0) / installments;
  const scholarshipDiscount =
    originalPerInstallment * (Number(plan.scholarship_percentage ?? 0) / 100);
  const firstMonth = new Date(`${parsed.data.first_due_month}-01T00:00:00.000Z`);

  const rows = Array.from({ length: installments }, (_, index) => ({
    student_id: asString(enrollment.student_id),
    plan_id: asString(plan.id),
    enrollment_id: asString(enrollment.id),
    course_id: asString(enrollmentClass.course_id),
    class_id: asString(enrollment.class_id),
    original_value: originalPerInstallment.toFixed(2),
    discount_value: (fixedDiscount + scholarshipDiscount).toFixed(2),
    fine_value: 0,
    interest_value: 0,
    due_date: dueDateFor(addMonths(firstMonth, index), Number(plan.due_day)),
    status: "open",
    notes:
      nullableText(parsed.data.notes) ??
      `Plano ${asString(plan.name)} - parcela ${index + 1}/${installments}`,
  }));

  const { error } = await supabase.from("invoices").insert(rows);
  if (error) return { error: "Não foi possível gerar as mensalidades." };

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/cobrancas");
  redirect("/dashboard/financeiro/cobrancas");
}

export async function registerPaymentAction(
  invoiceId: string,
  values: PaymentInput,
): Promise<ActionResult> {
  if (!(await canManageFinance())) {
    return { error: "Você não tem permissão para registrar pagamentos." };
  }

  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os dados do pagamento." };

  const profile = await getProfile();
  const supabase = await financeClient();
  const { error } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: toNumber(parsed.data.amount),
    payment_method: parsed.data.payment_method,
    paid_at: new Date(parsed.data.paid_at).toISOString(),
    received_by: profile?.id ?? null,
    notes: nullableText(parsed.data.notes),
  });

  if (error) return { error: "Não foi possível registrar o pagamento." };

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/cobrancas");
  revalidatePath(`/dashboard/financeiro/cobrancas/${invoiceId}`);
  return { success: true };
}

export async function updateInvoiceAdjustmentsAction(
  invoiceId: string,
  values: InvoiceAdjustmentInput,
): Promise<ActionResult> {
  if (!(await canManageFinance())) {
    return { error: "Você não tem permissão para ajustar cobranças." };
  }

  const parsed = invoiceAdjustmentSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os valores de ajuste." };

  const payload = {
    discount_value: toNumber(parsed.data.discount_value),
    fine_value: toNumber(parsed.data.fine_value),
    interest_value: toNumber(parsed.data.interest_value),
    notes: nullableText(parsed.data.notes),
  };

  const supabase = await financeClient();
  const { error } = await supabase.from("invoices").update(payload).eq("id", invoiceId);
  if (error) return { error: "Não foi possível registrar o ajuste." };

  await logInvoiceAction(invoiceId, "invoice.adjusted", payload);

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/cobrancas");
  revalidatePath(`/dashboard/financeiro/cobrancas/${invoiceId}`);
  return { success: true };
}

export async function manualCloseInvoiceAction(
  invoiceId: string,
  values: PaymentInput,
): Promise<ActionResult> {
  if (!(await canManageFinance())) {
    return { error: "Você não tem permissão para dar baixa manual." };
  }

  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os dados da baixa." };

  const result = await registerPaymentAction(invoiceId, {
    ...parsed.data,
    notes: parsed.data.notes || "Baixa manual",
  });

  if (result.error) return result;
  await logInvoiceAction(invoiceId, "invoice.manual_close", {
    amount: toNumber(parsed.data.amount),
    payment_method: parsed.data.payment_method,
  });
  return { success: true };
}

export async function renegotiateInvoiceAction(
  invoiceId: string,
  values: RenegotiationInput,
): Promise<ActionResult> {
  if (!(await canManageFinance())) {
    return { error: "Você não tem permissão para renegociar cobranças." };
  }

  const parsed = renegotiationSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os dados da renegociação." };

  const supabase = await financeClient();
  const { data: invoiceData } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  const invoice = asRecord(invoiceData);
  if (!invoice.id) return { error: "Cobrança não encontrada." };

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "renegotiated",
      notes: nullableText(parsed.data.notes) ?? asNullableString(invoice.notes),
    })
    .eq("id", invoiceId);

  if (updateError) return { error: "Não foi possível marcar a cobrança como renegociada." };

  const { data: newInvoiceData, error: insertError } = await supabase
    .from("invoices")
    .insert({
      student_id: asString(invoice.student_id),
      plan_id: asNullableString(invoice.plan_id),
      enrollment_id: asNullableString(invoice.enrollment_id),
      course_id: asNullableString(invoice.course_id),
      class_id: asNullableString(invoice.class_id),
      original_value: toNumber(parsed.data.amount),
      discount_value: 0,
      fine_value: 0,
      interest_value: 0,
      due_date: parsed.data.due_date,
      status: "open",
      notes: nullableText(parsed.data.notes) ?? `Renegociação da cobrança ${invoiceId}`,
    })
    .select("id")
    .single();

  if (insertError) return { error: "Não foi possível criar a nova cobrança renegociada." };

  const newInvoiceId = asString(asRecord(newInvoiceData).id);
  if (!newInvoiceId) return { error: "Renegociação criada, mas não foi possível abrir a nova cobrança." };

  await logInvoiceAction(invoiceId, "invoice.renegotiated", {
    new_invoice_id: newInvoiceId,
    amount: toNumber(parsed.data.amount),
    due_date: parsed.data.due_date,
  });

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/cobrancas");
  redirect(`/dashboard/financeiro/cobrancas/${newInvoiceId}`);
}

export async function cancelInvoiceAction(
  invoiceId: string,
  values: CancelInvoiceInput,
): Promise<ActionResult> {
  if (!(await canManageFinance())) {
    return { error: "Você não tem permissão para cancelar cobranças." };
  }

  const parsed = cancelInvoiceSchema.safeParse(values);
  if (!parsed.success) return { error: "Observação inválida." };

  const supabase = await financeClient();
  const { error } = await supabase
    .from("invoices")
    .update({
      status: "cancelled",
      notes: nullableText(parsed.data.notes),
    })
    .eq("id", invoiceId);

  if (error) return { error: "Não foi possível cancelar a cobrança." };

  await logInvoiceAction(invoiceId, "invoice.cancelled", {
    notes: nullableText(parsed.data.notes),
  });

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/cobrancas");
  revalidatePath(`/dashboard/financeiro/cobrancas/${invoiceId}`);
  return { success: true };
}

export async function deletePaymentAction(paymentId: string, invoiceId: string): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { error: "Apenas o administrador pode excluir pagamentos." };
  }

  const supabase = await financeClient();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { error: "Não foi possível excluir o pagamento." };

  await logInvoiceAction(invoiceId, "payment.deleted", { payment_id: paymentId });

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/financeiro/cobrancas");
  revalidatePath(`/dashboard/financeiro/cobrancas/${invoiceId}`);
  return { success: true };
}
