import "server-only";

// =============================================================================
// Consultas do módulo de Alertas (RLS: can_view_alert por perfil)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import type { Alert, AlertPriority, AlertStatus, AlertType } from "@/types/models";
import { ALERT_PRIORITY_RANK } from "./labels";

export interface AlertRow extends Alert {
  studentName: string | null;
  className: string | null;
  userName: string | null;
}

export interface AlertFilters {
  priority?: AlertPriority;
  type?: AlertType;
  status?: AlertStatus;
}

export interface AlertSummary {
  open: number; // alertas em aberto (novo + visualizado)
  novo: number;
  byPriority: Record<AlertPriority, number>;
}

/** Gera alertas automaticamente quando o perfil atual pode tratar alertas. */
export async function generateAlertsIfAllowed(): Promise<number> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "alerts.manage")) return 0;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_alerts");
  if (error) return 0;
  return data ?? 0;
}

/** Anexa os nomes das entidades relacionadas (aluno/turma/usuário). */
async function attachRelated(alerts: Alert[]): Promise<AlertRow[]> {
  if (alerts.length === 0) return [];
  const supabase = await createClient();

  const ids = (key: "related_student_id" | "related_class_id" | "related_user_id") =>
    [...new Set(alerts.map((a) => a[key]).filter((v): v is string => !!v))];

  const studentIds = ids("related_student_id");
  const classIds = ids("related_class_id");
  const userIds = ids("related_user_id");

  const [students, classes, profiles] = await Promise.all([
    studentIds.length
      ? supabase.from("students").select("id, full_name").in("id", studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    classIds.length
      ? supabase.from("classes").select("id, name").in("id", classIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    userIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);

  const studentMap = new Map((students.data ?? []).map((s) => [s.id, s.full_name]));
  const classMap = new Map((classes.data ?? []).map((c) => [c.id, c.name]));
  const userMap = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));

  return alerts.map((a) => ({
    ...a,
    studentName: a.related_student_id ? studentMap.get(a.related_student_id) ?? null : null,
    className: a.related_class_id ? classMap.get(a.related_class_id) ?? null : null,
    userName: a.related_user_id ? userMap.get(a.related_user_id) ?? null : null,
  }));
}

/** Ordena por prioridade (crítica→baixa) mantendo a ordem de criação dentro do grupo. */
function byPriorityDesc(rows: Alert[]): Alert[] {
  return [...rows].sort(
    (a, b) => ALERT_PRIORITY_RANK[b.priority as AlertPriority] - ALERT_PRIORITY_RANK[a.priority as AlertPriority],
  );
}

export async function listAlerts(filters: AlertFilters = {}): Promise<AlertRow[]> {
  const supabase = await createClient();
  let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);
  const { data } = await query;
  return attachRelated(byPriorityDesc((data ?? []) as Alert[]));
}

export async function getAlertSummary(): Promise<AlertSummary> {
  const supabase = await createClient();
  const { data } = await supabase.from("alerts").select("priority, status");
  const rows = data ?? [];
  const open = rows.filter((r) => r.status === "novo" || r.status === "visualizado");
  const byPriority: Record<AlertPriority, number> = { baixa: 0, media: 0, alta: 0, critica: 0 };
  for (const r of open) byPriority[r.priority as AlertPriority] += 1;
  return {
    open: open.length,
    novo: rows.filter((r) => r.status === "novo").length,
    byPriority,
  };
}

/** Alertas em aberto mais relevantes para exibir no dashboard. */
export async function listDashboardAlerts(limit = 5): Promise<AlertRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .in("status", ["novo", "visualizado"])
    .order("created_at", { ascending: false })
    .limit(50);
  return attachRelated(byPriorityDesc((data ?? []) as Alert[]).slice(0, limit));
}
