import Link from "next/link";
import {
  buildMonthGrid,
  buildWeek,
  eventDateKey,
  eventTime,
  WEEKDAY_SHORT,
} from "@/lib/calendar/dates";
import { EVENT_TYPE_DOT, EVENT_TYPE_BADGE, eventTypeLabel } from "@/lib/calendar/labels";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import type { CalendarEventRow } from "@/lib/calendar/queries";
import type { CalendarEventType } from "@/types/models";

function groupByDay(events: CalendarEventRow[]): Map<string, CalendarEventRow[]> {
  const map = new Map<string, CalendarEventRow[]>();
  for (const e of events) {
    const k = eventDateKey(e.start_datetime);
    const arr = map.get(k) ?? [];
    arr.push(e);
    map.set(k, arr);
  }
  return map;
}

function EventChip({ e }: { e: CalendarEventRow }) {
  return (
    <Link
      href={`/dashboard/calendario/${e.id}`}
      className="block truncate rounded px-1 py-0.5 text-xs hover:bg-slate-100"
      title={`${eventTime(e.start_datetime)} ${e.title}`}
    >
      <span className={`mr-1 inline-block h-2 w-2 rounded-full align-middle ${EVENT_TYPE_DOT[e.type as CalendarEventType]}`} />
      <span className="align-middle text-slate-700">{eventTime(e.start_datetime)} {e.title}</span>
    </Link>
  );
}

// --- Mês ---------------------------------------------------------------------
export function MonthView({ events, refKey }: { events: CalendarEventRow[]; refKey: string }) {
  const [y, m] = refKey.split("-").map(Number);
  const cells = buildMonthGrid(y, m - 1);
  const byDay = groupByDay(events);

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c) => {
          const dayEvents = byDay.get(c.key) ?? [];
          return (
            <div
              key={c.key}
              className={`min-h-[92px] border-b border-r border-slate-100 p-1 ${c.inMonth ? "" : "bg-slate-50/60"}`}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    c.isToday ? "bg-indigo-600 font-semibold text-white" : c.inMonth ? "text-slate-600" : "text-slate-300"
                  }`}
                >
                  {c.day}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventChip key={e.id} e={e} />
                ))}
                {dayEvents.length > 3 && (
                  <p className="px-1 text-[11px] text-slate-400">+{dayEvents.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// --- Semana ------------------------------------------------------------------
export function WeekView({ events, refKey }: { events: CalendarEventRow[]; refKey: string }) {
  const week = buildWeek(refKey);
  const byDay = groupByDay(events);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {week.map((c) => {
        const dayEvents = byDay.get(c.key) ?? [];
        return (
          <Card key={c.key} className="p-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{WEEKDAY_SHORT[new Date(c.key + "T12:00:00Z").getUTCDay()]}</span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${c.isToday ? "bg-indigo-600 font-semibold text-white" : "text-slate-600"}`}>
                {c.day}
              </span>
            </div>
            <div className="space-y-1">
              {dayEvents.length === 0 ? (
                <p className="text-[11px] text-slate-300">—</p>
              ) : (
                dayEvents.map((e) => <EventChip key={e.id} e={e} />)
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// --- Lista -------------------------------------------------------------------
export function ListView({ events }: { events: CalendarEventRow[] }) {
  if (events.length === 0) {
    return <EmptyState icon={CalendarDays} title="Nenhum evento" description="Não há eventos no período selecionado." />;
  }
  const byDay = groupByDay(events);
  const days = [...byDay.keys()].sort();

  return (
    <div className="space-y-4">
      {days.map((k) => (
        <div key={k}>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            {new Date(k + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </h3>
          <Card className="divide-y divide-slate-100">
            {byDay.get(k)!.map((e) => (
              <Link key={e.id} href={`/dashboard/calendario/${e.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${EVENT_TYPE_DOT[e.type as CalendarEventType]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {eventTime(e.start_datetime)}
                    {e.end_datetime ? `–${eventTime(e.end_datetime)}` : ""}
                    {e.className ? ` · ${e.className}` : ""}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${EVENT_TYPE_BADGE[e.type as CalendarEventType]}`}>
                  {eventTypeLabel(e.type as CalendarEventType)}
                </span>
              </Link>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}
