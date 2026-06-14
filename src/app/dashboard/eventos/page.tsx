import Link from "next/link";
import { Plus, Ticket, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listEvents } from "@/lib/events/queries";
import { EVENT_STATUS_BADGE, eventStatusLabel } from "@/lib/events/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { EventStatus } from "@/types/models";

export default async function EventosPage() {
  await requirePermission("leads.manage");
  const events = await listEvents();

  return (
    <>
      <PageHeader
        title="Eventos e Palestras"
        description="Eventos institucionais, inscrições e conversões."
        action={
          <Link href="/dashboard/eventos/novo">
            <Button><Plus className="h-4 w-4" /> Novo evento</Button>
          </Link>
        }
      />
      {events.length === 0 ? (
        <EmptyState icon={Ticket} title="Nenhum evento" description="Crie o primeiro evento institucional." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {events.map((e) => (
            <Link key={e.id} href={`/dashboard/eventos/${e.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{e.name}</p>
                <p className="text-xs text-slate-500">
                  {e.date ? formatDate(e.date) : "Sem data"}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Users className="h-3 w-3" /> {e.registrationCount}
                {e.max_registrations ? `/${e.max_registrations}` : ""}
              </span>
              <Badge className={EVENT_STATUS_BADGE[e.status as EventStatus]}>{eventStatusLabel(e.status as EventStatus)}</Badge>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
