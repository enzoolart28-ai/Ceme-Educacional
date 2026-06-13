import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventTime, eventDateKey } from "@/lib/calendar/dates";
import { EVENT_TYPE_DOT } from "@/lib/calendar/labels";
import type { CalendarEventRow } from "@/lib/calendar/queries";
import type { CalendarEventType } from "@/types/models";

function shortDay(iso: string): string {
  return new Date(eventDateKey(iso) + "T12:00:00Z").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function UpcomingEvents({ events }: { events: CalendarEventRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-600" /> Próximos eventos
        </CardTitle>
        <Link href="/dashboard/calendario" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
          Ver calendário <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum evento próximo.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/dashboard/calendario/${e.id}`} className="flex items-center gap-3 py-2 hover:bg-slate-50">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${EVENT_TYPE_DOT[e.type as CalendarEventType]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {shortDay(e.start_datetime)} · {eventTime(e.start_datetime)}
                      {e.className ? ` · ${e.className}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
