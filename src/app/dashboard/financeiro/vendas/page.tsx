import { requireRole, FINANCE_ROLES } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { QuickLeadForm } from "@/components/leads/quick-lead-form";

export default async function VendasPage() {
  await requireRole(FINANCE_ROLES);

  return (
    <>
      <PageHeader
        title="Vendas"
        description="Registre um interessado / venda em potencial. O contato entra como lead no funil do time comercial."
      />
      <div className="max-w-2xl">
        <QuickLeadForm />
      </div>
    </>
  );
}
