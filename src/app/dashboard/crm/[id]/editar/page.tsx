import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getLead } from "@/lib/crm/queries";
import { PageHeader } from "@/components/ui/page-header";
import { LeadForm } from "@/components/crm/lead-form";

export default async function EditarLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireAuth();
  if (!hasPermission(profile.role, "leads.manage")) notFound();
  const lead = await getLead(id);
  if (!lead) notFound();

  return (
    <>
      <Link href={`/dashboard/crm/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para o lead
      </Link>
      <PageHeader title="Editar lead" description="Atualize os dados do interessado." />
      <LeadForm
        mode="edit"
        leadId={id}
        defaultValues={{
          full_name: lead.full_name,
          phone: lead.phone ?? "",
          email: lead.email ?? "",
          age: lead.age != null ? String(lead.age) : "",
          guardian_name: lead.guardian_name ?? "",
          course_interest: lead.course_interest ?? "",
          source: lead.source,
          city: lead.city ?? "",
          status: lead.status,
          notes: lead.notes ?? "",
        }}
      />
    </>
  );
}
