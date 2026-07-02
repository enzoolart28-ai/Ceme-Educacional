import { requireAuth } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { QuickLeadForm } from "@/components/leads/quick-lead-form";

export default async function CaptarLeadPage() {
  await requireAuth();

  return (
    <>
      <PageHeader
        title="Captar Lead"
        description="Cadastre um interessado rapidamente. O time comercial recebe e dá sequência ao atendimento."
      />
      <div className="max-w-2xl">
        <QuickLeadForm />
      </div>
    </>
  );
}
