import Link from "next/link";
import { Edit, Plus, WalletCards } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listFinancialPlans } from "@/lib/finance/queries";
import { formatMoney } from "@/lib/finance/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FinancialPlanDeleteButton } from "@/components/finance/financial-plan-delete-button";
import type { FinancialPlanRow } from "@/lib/finance/queries";

export default async function FinancialPlansPage() {
  await requirePermission("finance.manage");
  const plans = await listFinancialPlans();

  const columns: Column<FinancialPlanRow>[] = [
    { header: "Plano", cell: (plan) => plan.name },
    { header: "Curso", cell: (plan) => plan.courseName ?? "Todos" },
    { header: "Valor", cell: (plan) => formatMoney(plan.total_value) },
    { header: "Parcelas", cell: (plan) => plan.installments },
    { header: "Vencimento", cell: (plan) => `Dia ${plan.due_day}` },
    { header: "Bolsa", cell: (plan) => `${plan.scholarship_percentage}%` },
    {
      header: "Ações",
      cell: (plan) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/financeiro/planos/${plan.id}/editar`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" /> Editar
            </Button>
          </Link>
          <FinancialPlanDeleteButton planId={plan.id} />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Planos financeiros"
        description="Planos de pagamento, descontos e bolsas."
        action={
          <Link href="/dashboard/financeiro/planos/novo">
            <Button>
              <Plus className="h-4 w-4" /> Novo plano
            </Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={plans}
        getRowKey={(plan) => plan.id}
        emptyIcon={WalletCards}
        emptyTitle="Nenhum plano cadastrado"
        emptyDescription="Crie um plano para gerar mensalidades."
      />
    </>
  );
}

