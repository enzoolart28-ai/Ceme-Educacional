import "server-only";

// =============================================================================
// Consultas — Contas a Pagar (despesas)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type { ExpenseCategory, Payee, PayableStatus } from "@/types/models";

export interface PayableRow {
  id: string;
  description: string;
  amount: number;
  due_date: string | null;
  status: PayableStatus; // armazenado
  effectiveStatus: PayableStatus; // com 'vencido' calculado na hora
  paid_at: string | null;
  recurring: boolean;
  notes: string | null;
  categoryId: string;
  categoryName: string;
  payeeId: string | null;
  payeeName: string | null;
  pixKey: string | null;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
  paid: number;
  pending: number;
}

export interface MonthlyPayables {
  rows: PayableRow[];
  byCategory: CategoryTotal[];
  grandTotal: number;
  paidTotal: number;
  pendingTotal: number;
}

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  return data ?? [];
}

export async function listPayees(): Promise<Payee[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payees")
    .select("*")
    .eq("active", true)
    .order("name");
  return data ?? [];
}

type EmbeddedName = { name: string } | { name: string }[] | null;
type EmbeddedPayee = { name: string; pix_key: string | null } | { name: string; pix_key: string | null }[] | null;
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export async function getMonthlyPayables(year: number, month: number): Promise<MonthlyPayables> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("payables")
    .select(
      "id, description, amount, due_date, status, paid_at, recurring, notes, category_id, payee_id, category:expense_categories(name), payee:payees(name, pix_key)",
    )
    .eq("competence_year", year)
    .eq("competence_month", month)
    .order("created_at");

  const rows: PayableRow[] = (data ?? []).map((r) => {
    const cat = one(r.category as EmbeddedName);
    const pay = one(r.payee as EmbeddedPayee);
    const status = r.status as PayableStatus;
    const effectiveStatus: PayableStatus =
      status === "pendente" && r.due_date && r.due_date < today ? "vencido" : status;
    return {
      id: r.id,
      description: r.description,
      amount: Number(r.amount) || 0,
      due_date: r.due_date,
      status,
      effectiveStatus,
      paid_at: r.paid_at,
      recurring: r.recurring,
      notes: r.notes,
      categoryId: r.category_id,
      categoryName: cat?.name ?? "—",
      payeeId: r.payee_id,
      payeeName: pay?.name ?? null,
      pixKey: pay?.pix_key ?? null,
    };
  });

  const catMap = new Map<string, CategoryTotal>();
  let grandTotal = 0;
  let paidTotal = 0;
  let pendingTotal = 0;

  for (const row of rows) {
    if (row.effectiveStatus === "cancelado") continue;
    grandTotal += row.amount;
    if (row.status === "pago") paidTotal += row.amount;
    else pendingTotal += row.amount;

    const entry = catMap.get(row.categoryId) ?? {
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      total: 0,
      paid: 0,
      pending: 0,
    };
    entry.total += row.amount;
    if (row.status === "pago") entry.paid += row.amount;
    else entry.pending += row.amount;
    catMap.set(row.categoryId, entry);
  }

  return {
    rows,
    byCategory: [...catMap.values()].sort((a, b) => b.total - a.total),
    grandTotal,
    paidTotal,
    pendingTotal,
  };
}
