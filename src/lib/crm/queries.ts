import "server-only";

// =============================================================================
// Consultas do módulo Comercial / CRM (com RLS — exige leads.manage)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type { Lead, LeadInteraction, LeadSource, LeadStatus } from "@/types/models";

export interface LeadFilters {
  q?: string;
  course?: string;
  status?: LeadStatus;
  source?: LeadSource;
  capturedBy?: string; // id do perfil que captou o lead
}

export interface InteractionRow extends LeadInteraction {
  userName: string;
}

export async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const supabase = await createClient();
  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });

  if (filters.q && filters.q.trim()) {
    const t = filters.q.trim();
    query = query.or(`full_name.ilike.%${t}%,phone.ilike.%${t}%,email.ilike.%${t}%`);
  }
  if (filters.course) query = query.ilike("course_interest", `%${filters.course}%`);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.capturedBy) query = query.eq("created_by", filters.capturedBy);

  const { data } = await query;
  return data ?? [];
}

/** Lista de usuários que já captaram algum lead (para o filtro "Captado por"). */
export async function listLeadCapturers(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("created_by, created_by_name")
    .not("created_by", "is", null);

  const byId = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.created_by && !byId.has(row.created_by)) {
      byId.set(row.created_by, row.created_by_name ?? "—");
    }
  }
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getLeadInteractions(leadId: string): Promise<InteractionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_interactions")
    .select("*, user:profiles(full_name)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((i) => {
    const row = i as typeof i & { user: { full_name: string | null } | null };
    return { ...(row as unknown as LeadInteraction), userName: row.user?.full_name ?? "—" };
  });
}

// --- Relatórios --------------------------------------------------------------
export interface CrmReports {
  total: number;
  converted: number;
  conversionRate: number;
  byStatus: { status: LeadStatus; count: number }[];
  bySource: { source: LeadSource; total: number; converted: number }[];
  byCourse: { course: string; total: number }[];
}

export async function getCrmReports(): Promise<CrmReports> {
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("status, source, course_interest");
  const leads = data ?? [];

  const total = leads.length;
  const converted = leads.filter((l) => l.status === "matriculado").length;

  const statusMap = new Map<string, number>();
  const sourceMap = new Map<string, { total: number; converted: number }>();
  const courseMap = new Map<string, number>();

  for (const l of leads) {
    statusMap.set(l.status, (statusMap.get(l.status) ?? 0) + 1);
    const s = sourceMap.get(l.source) ?? { total: 0, converted: 0 };
    s.total += 1;
    if (l.status === "matriculado") s.converted += 1;
    sourceMap.set(l.source, s);
    const course = l.course_interest?.trim() || "(não informado)";
    courseMap.set(course, (courseMap.get(course) ?? 0) + 1);
  }

  return {
    total,
    converted,
    conversionRate: total > 0 ? converted / total : 0,
    byStatus: [...statusMap.entries()].map(([status, count]) => ({ status: status as LeadStatus, count })),
    bySource: [...sourceMap.entries()]
      .map(([source, v]) => ({ source: source as LeadSource, ...v }))
      .sort((a, b) => b.total - a.total),
    byCourse: [...courseMap.entries()]
      .map(([course, total]) => ({ course, total }))
      .sort((a, b) => b.total - a.total),
  };
}
