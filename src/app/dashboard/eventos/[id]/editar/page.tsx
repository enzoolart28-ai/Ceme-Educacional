import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getEvent, listStaffProfiles } from "@/lib/events/queries";
import { PageHeader } from "@/components/ui/page-header";
import { EventForm } from "@/components/events/event-form";

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("leads.manage");
  const [event, responsibles] = await Promise.all([getEvent(id), listStaffProfiles()]);
  if (!event) notFound();

  return (
    <>
      <Link href={`/dashboard/eventos/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para o evento
      </Link>
      <PageHeader title="Editar evento" description="Atualize os dados do evento." />
      <EventForm
        mode="edit"
        eventId={id}
        responsibles={responsibles}
        defaultValues={{
          name: event.name,
          description: event.description ?? "",
          date: event.date ?? "",
          start_time: event.start_time?.slice(0, 5) ?? "",
          end_time: event.end_time?.slice(0, 5) ?? "",
          location: event.location ?? "",
          target_audience: event.target_audience ?? "",
          max_registrations: event.max_registrations != null ? String(event.max_registrations) : "",
          responsible_user_id: event.responsible_user_id ?? "",
          status: event.status,
        }}
      />
    </>
  );
}
