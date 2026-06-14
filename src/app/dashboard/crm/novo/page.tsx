import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { LeadForm } from "@/components/crm/lead-form";

export default async function NovoLeadPage() {
  await requirePermission("leads.manage");
  return (
    <>
      <Link href="/dashboard/crm" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para o CRM
      </Link>
      <PageHeader title="Novo lead" description="Cadastre um interessado." />
      <LeadForm
        mode="create"
        defaultValues={{
          full_name: "",
          phone: "",
          email: "",
          age: "",
          guardian_name: "",
          course_interest: "",
          source: "outro",
          city: "",
          status: "novo",
          notes: "",
        }}
      />
    </>
  );
}
