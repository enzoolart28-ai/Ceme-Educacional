import "server-only";

// =============================================================================
// Consultas do módulo de Calendário Acadêmico (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, CalendarEventType } from "@/types/models";

export interface CalendarEventRow extends CalendarEvent {
  className: string | null;
  courseName: string | null;
  unitName: string | null;
  teacherName: string | null;
}

export interface EventFilters {
  rangeStart?: string;
  rangeEnd?: string;
  type?: CalendarEventType;
  course?: string;
  class?: string;
  teacher?: string;
  unit?: string;
}

const SELECT =
  "*, course:courses(name), class:classes(name), unit:units(name), teacher:teachers(full_name)";

function mapRow(r: Record<string, unknown>): CalendarEventRow {
  const row = r as typeof r & {
    course: { name: string } | null;
    class: { name: string } | null;
    unit: { name: string } | null;
    teacher: { full_name: string } | null;
  };
  return {
    ...(row as unknown as CalendarEvent),
    courseName: row.course?.name ?? null,
    className: row.class?.name ?? null,
    unitName: row.unit?.name ?? null,
    teacherName: row.teacher?.full_name ?? null,
  };
}

export async function listEvents(filters: EventFilters = {}): Promise<CalendarEventRow[]> {
  const supabase = await createClient();
  let query = supabase.from("calendar_events").select(SELECT).order("start_datetime");

  if (filters.rangeStart) query = query.gte("start_datetime", filters.rangeStart);
  if (filters.rangeEnd) query = query.lte("start_datetime", filters.rangeEnd);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.course) query = query.eq("course_id", filters.course);
  if (filters.class) query = query.eq("class_id", filters.class);
  if (filters.teacher) query = query.eq("teacher_id", filters.teacher);
  if (filters.unit) query = query.eq("unit_id", filters.unit);

  const { data } = await query;
  return (data ?? []).map(mapRow);
}

export async function getEvent(id: string): Promise<CalendarEventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("calendar_events").select(SELECT).eq("id", id).maybeSingle();
  return data ? mapRow(data) : null;
}

/** Próximos eventos relevantes (para o dashboard) — respeita RLS. */
export async function listUpcomingEvents(limit = 5): Promise<CalendarEventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select(SELECT)
    .gte("start_datetime", new Date().toISOString())
    .order("start_datetime")
    .limit(limit);
  return (data ?? []).map(mapRow);
}

export async function listUnits(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("units").select("id, name").order("name");
  return data ?? [];
}
