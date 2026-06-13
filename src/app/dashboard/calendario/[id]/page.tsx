import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Pencil } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { getEvent } from "@/lib/calendar/queries";
import { eventTime, eventDateKey } from "@/lib/calendar/dates";
import { EVENT_TYPE_BADGE, eventTypeLabel, visibilityLabel } from "@/lib/calendar/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventDeleteButton } from "@/components/calendar/event-delete-button";
import type { CalendarEventType } from "@/types/models";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}

export default async function EventoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireAuth();
  const e = await getEvent(id);
  if (!e) notFound();

  const canManage = e.created_by === profile.id || STAFF_ROLES.includes(profile.role);
  const dayLabel = new Date(eventDateKey(e.start_datetime) + "T12:00:00Z").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Link href="/dashboard/calendario" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para o calendário
      </Link>
      <PageHeader
        title={e.title}
        action={
          <div className="flex items-center gap-2">
            <Badge className={EVENT_TYPE_BADGE[e.type as CalendarEventType]}>
              {eventTypeLabel(e.type as CalendarEventType)}
            </Badge>
            {canManage && (
              <>
                <Link href={`/dashboard/calendario/${id}/editar`}>
                  <Button variant="outline"><Pencil className="h-4 w-4" /> Editar</Button>
                </Link>
                <EventDeleteButton id={id} />
              </>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {dayLabel} · {eventTime(e.start_datetime)}
              {e.end_datetime ? `–${eventTime(e.end_datetime)}` : ""}
            </span>
            {e.location && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {e.location}</span>
            )}
          </div>

          {e.description && <p className="whitespace-pre-wrap text-sm text-slate-700">{e.description}</p>}

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
            {e.courseName && <Info label="Curso" value={e.courseName} />}
            {e.className && <Info label="Turma" value={e.className} />}
            {e.unitName && <Info label="Unidade" value={e.unitName} />}
            {e.teacherName && <Info label="Professor" value={e.teacherName} />}
            <Info label="Visibilidade" value={visibilityLabel(e.visibility)} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
