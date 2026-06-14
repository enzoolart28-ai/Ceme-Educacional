import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Users, UserCheck, UserPlus, GraduationCap, Clock, MapPin } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getEvent, getEventRegistrations, getEventReport } from "@/lib/events/queries";
import { EVENT_STATUS_BADGE, eventStatusLabel } from "@/lib/events/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  EventDeleteButton,
  AttendanceToggle,
  RegistrationConvert,
  PublicLink,
} from "@/components/events/event-actions";
import type { EventStatus } from "@/types/models";

export default async function EventoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("leads.manage");
  const event = await getEvent(id);
  if (!event) notFound();
  const [registrations, report] = await Promise.all([getEventRegistrations(id), getEventReport(id)]);

  const timeLabel = [event.start_time?.slice(0, 5), event.end_time?.slice(0, 5)].filter(Boolean).join("–");

  return (
    <>
      <Link href="/dashboard/eventos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para eventos
      </Link>
      <PageHeader
        title={event.name}
        description={event.target_audience ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge className={EVENT_STATUS_BADGE[event.status as EventStatus]}>{eventStatusLabel(event.status as EventStatus)}</Badge>
            <Link href={`/dashboard/eventos/${id}/editar`}><Button variant="outline"><Pencil className="h-4 w-4" /> Editar</Button></Link>
            <EventDeleteButton id={id} />
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {event.date && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {formatDate(event.date)}{timeLabel ? ` · ${timeLabel}` : ""}</span>}
          {event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>}
          {event.responsibleName && <span>Responsável: {event.responsibleName}</span>}
        </CardContent>
      </Card>

      {event.description && (
        <Card className="mb-4"><CardContent><p className="whitespace-pre-wrap text-sm text-slate-700">{event.description}</p></CardContent></Card>
      )}

      <div className="mb-4"><PublicLink eventId={id} /></div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Inscritos" value={report.total} icon={Users} tone="indigo" />
        <StatCard label="Presentes" value={report.attended} icon={UserCheck} tone="emerald" />
        <StatCard label="Viraram lead" value={report.leads} icon={UserPlus} tone="amber" />
        <StatCard label="Viraram aluno" value={report.students} icon={GraduationCap} tone="sky" />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Inscritos</h2>
      {registrations.length === 0 ? (
        <EmptyState icon={Users} title="Sem inscritos" description="Compartilhe o link público para receber inscrições." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {registrations.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{r.full_name}</p>
                <p className="text-xs text-slate-500">
                  {[r.phone, r.email, r.city, r.school, r.course_interest].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AttendanceToggle registrationId={r.id} eventId={id} attended={r.attended} />
                <RegistrationConvert
                  registrationId={r.id}
                  eventId={id}
                  convertedToLead={r.converted_to_lead}
                  convertedToStudent={r.converted_to_student}
                />
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
