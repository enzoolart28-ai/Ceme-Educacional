import Link from "next/link";
import { ArrowLeft, BarChart3, CreditCard, Receipt } from "lucide-react";
import { requireRole, FINANCE_ROLES } from "@/lib/auth/session";
import { getFinanceReports } from "@/lib/finance/queries";
import { formatMoney } from "@/lib/finance/format";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/lib/finance/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";

type StatusReportRow = { status: InvoiceStatus; count: number; amount: number };
type MethodReportRow = { method: PaymentMethod; count: number; amount: number };
type MonthlyReportRow = { month: string; amount: number };

export default async function FinanceReportsPage() {
  await requireRole(FINANCE_ROLES);
  const reports = await getFinanceReports();

  const statusColumns: Column<StatusReportRow>[] = [
    { header: "Status", cell: (row) => INVOICE_STATUS_LABELS[row.status] },
    { header: "Cobranças", cell: (row) => row.count },
    { header: "Valor", cell: (row) => formatMoney(row.amount) },
  ];

  const methodColumns: Column<MethodReportRow>[] = [
    { header: "Forma de pagamento", cell: (row) => PAYMENT_METHOD_LABELS[row.method] },
    { header: "Pagamentos", cell: (row) => row.count },
    { header: "Valor", cell: (row) => formatMoney(row.amount) },
  ];

  const monthlyColumns: Column<MonthlyReportRow>[] = [
    { header: "Mês", cell: (row) => row.month },
    { header: "Recebido", cell: (row) => formatMoney(row.amount) },
  ];

  return (
    <>
      <Link href="/dashboard/financeiro">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </Link>
      <PageHeader
        title="Relatórios financeiros"
        description="Resumo por status, forma de pagamento e mês."
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Por status</h2>
          <DataTable
            columns={statusColumns}
            data={reports.byStatus}
            getRowKey={(row) => row.status}
            emptyIcon={Receipt}
            emptyTitle="Sem cobranças"
            emptyDescription="Gere mensalidades para montar este relatório."
          />
        </section>
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Por forma de pagamento</h2>
          <DataTable
            columns={methodColumns}
            data={reports.byMethod}
            getRowKey={(row) => row.method}
            emptyIcon={CreditCard}
            emptyTitle="Sem pagamentos"
            emptyDescription="Registre pagamentos para montar este relatório."
          />
        </section>
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Recebimento mensal</h2>
          <DataTable
            columns={monthlyColumns}
            data={reports.monthlyRevenue}
            getRowKey={(row) => row.month}
            emptyIcon={BarChart3}
            emptyTitle="Sem recebimentos"
            emptyDescription="Pagamentos registrados aparecerão neste resumo."
          />
        </section>
      </div>
    </>
  );
}

