import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UnknownRecord = Record<string, unknown>;

export interface CashRegisterOption {
  id: string;
  name: string;
  unitId: string | null;
  unitName: string | null;
}

export interface CashSessionRow {
  id: string;
  cashRegisterId: string;
  cashRegisterName: string;
  unitName: string | null;
  openedByName: string;
  openedAt: string;
  openingBalance: number;
  expectedClosingBalance: number | null;
  informedClosingBalance: number | null;
  difference: number | null;
  status: string;
}

export interface CashMovementRow {
  id: string;
  sessionId: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  createdByName: string;
}

export interface CashFlowSummary {
  openingBalance: number;
  entries: number;
  exits: number;
  pending: number;
  cancelled: number;
  finalBalance: number;
}

type CashSessionStatus = Database["public"]["Enums"]["cash_session_status"];

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

export async function listCashRegisters(): Promise<CashRegisterOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cash_registers")
    .select("id, name, unit_id, unit:units(name)")
    .order("name");

  return records(data).map((row) => {
    const unit = asRecord(row.unit);
    return {
      id: str(row.id),
      name: str(row.name),
      unitId: maybeStr(row.unit_id),
      unitName: maybeStr(unit.name),
    };
  });
}

export async function listCashSessions(status?: CashSessionStatus): Promise<CashSessionRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("cash_sessions")
    .select(
      "*, cash_register:cash_registers(name), unit:units(name), opened_by_profile:profiles!cash_sessions_opened_by_fkey(full_name)",
    )
    .order("opened_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;

  return records(data).map((row) => {
    const cashRegister = asRecord(row.cash_register);
    const unit = asRecord(row.unit);
    const openedBy = asRecord(row.opened_by_profile);
    return {
      id: str(row.id),
      cashRegisterId: str(row.cash_register_id),
      cashRegisterName: str(cashRegister.name, "Caixa"),
      unitName: maybeStr(unit.name),
      openedByName: str(openedBy.full_name, "-"),
      openedAt: str(row.opened_at),
      openingBalance: num(row.opening_balance),
      expectedClosingBalance: row.expected_closing_balance == null ? null : num(row.expected_closing_balance),
      informedClosingBalance: row.informed_closing_balance == null ? null : num(row.informed_closing_balance),
      difference: row.difference == null ? null : num(row.difference),
      status: str(row.status),
    };
  });
}

export async function listCashMovements(): Promise<CashMovementRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cash_movements")
    .select("*, created_by_profile:profiles!cash_movements_created_by_fkey(full_name)")
    .order("created_at", { ascending: false });

  return records(data).map((row) => {
    const profile = asRecord(row.created_by_profile);
    return {
      id: str(row.id),
      sessionId: str(row.cash_session_id),
      type: str(row.movement_type),
      category: str(row.category),
      description: maybeStr(row.description),
      amount: num(row.amount),
      paymentMethod: str(row.payment_method),
      status: str(row.status),
      createdAt: str(row.created_at),
      createdByName: str(profile.full_name, "-"),
    };
  });
}

export async function getCashFlowSummary(): Promise<CashFlowSummary> {
  const [sessions, movements] = await Promise.all([
    listCashSessions(),
    listCashMovements(),
  ]);
  const openSessions = sessions.filter((session) => session.status === "open");
  const openingBalance = openSessions.reduce((sum, session) => sum + session.openingBalance, 0);
  const entries = movements
    .filter((movement) => movement.status === "completed" && ["entry", "reinforcement", "adjustment", "reversal"].includes(movement.type))
    .reduce((sum, movement) => sum + movement.amount, 0);
  const exits = movements
    .filter((movement) => movement.status === "completed" && ["exit", "withdrawal"].includes(movement.type))
    .reduce((sum, movement) => sum + movement.amount, 0);
  return {
    openingBalance,
    entries,
    exits,
    pending: movements.filter((movement) => movement.status === "pending").length,
    cancelled: movements.filter((movement) => movement.status === "cancelled").length,
    finalBalance: openingBalance + entries - exits,
  };
}
