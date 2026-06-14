import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth, requirePermission } from "@/lib/auth/session";
import { listStaffProfiles } from "@/lib/events/queries";
import { PageHeader } from "@/components/ui/page-header";
import { EventForm } from "@/components/events/event-form";

export default async function NovoEventoPage() {
  await requirePermission("leads.manage");
  const profile = await requireAuth();
  const responsibles = await listStaffProfiles();

  return (
    <>
      <Link href="/dashboard/eventos" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para eventos
      </Link>
      <PageHeader title="Novo evento" description="Cadastre um evento institucional." />
      <EventForm
        mode="create"
        responsibles={responsibles}
        defaultValues={{
          name: "",
          description: "",
          date: "",
          start_time: "",
          end_time: "",
          location: "",
          target_audience: "",
          max_registrations: "",
          responsible_user_id: profile.id,
          status: "planejado",
        }}
      />
    </>
  );
}
