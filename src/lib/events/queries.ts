import "server-only";

// =============================================================================
// Consultas do módulo de Eventos (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type { Event, EventRegistration } from "@/types/models";

export interface EventRow extends Event {
  registrationCount: number;
}

export interface EventReport {
  total: number;
  attended: number;
  leads: number;
  students: number;
}

// --- Interno (gestor) --------------------------------------------------------
export async function listEvents(): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, registrations:event_registrations(count)")
    .order("date", { ascending: false, nullsFirst: false });
  return (data ?? []).map((e) => {
    const row = e as typeof e & { registrations: { count: number }[] };
    return { ...(row as unknown as Event), registrationCount: row.registrations?.[0]?.count ?? 0 };
  });
}

export async function getEvent(
  id: string,
): Promise<(Event & { responsibleName: string | null }) | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, responsible:profiles(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as typeof data & { responsible: { full_name: string | null } | null };
  return { ...(row as unknown as Event), responsibleName: row.responsible?.full_name ?? null };
}

export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getEventReport(eventId: string): Promise<EventReport> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select("attended, converted_to_lead, converted_to_student")
    .eq("event_id", eventId);
  const rows = data ?? [];
  return {
    total: rows.length,
    attended: rows.filter((r) => r.attended).length,
    leads: rows.filter((r) => r.converted_to_lead).length,
    students: rows.filter((r) => r.converted_to_student).length,
  };
}

/** Perfis da equipe (para escolher o responsável pelo evento). */
export async function listStaffProfiles(): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["admin", "diretor", "coordenacao", "secretaria", "professor"])
    .order("full_name");
  return (data ?? []).map((p) => ({ id: p.id, full_name: p.full_name ?? "—" }));
}

// --- Público (anônimo) -------------------------------------------------------
/** Evento para a página pública (RLS anon só retorna se status='aberto_inscricao'). */
export async function getPublicEvent(id: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
