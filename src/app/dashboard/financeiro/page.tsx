import Link from "next/link";
import { AlertTriangle, Banknote, FileText, Plus, Receipt, Wallet } from "lucide-react";
import { requireRole, FINANCE_ROLES } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getFinanceDashboardStats, listInvoices } from "@/lib/finance/queries";
import { formatDateOnly, formatMoney } from "@/lib/finance/format";
import { INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InvoiceStatusBadge } from "@/components/finance/invoice-status-badge";
import type { InvoiceRow } from "@/lib/finance/queries";

export default async function FinanceiroPage() {
  const profile = await requireRole(FINANCE_ROLES);
  const canManage = hasPermission(profile.role, "finance.manage");
  const [stats, invoices] = await Promise.all([
    getFinanceDashboardStats(),
    listInvoices(),
  ]);
  const recent = invoices.slice(0, 8);

  const columns: Column<InvoiceRow>[] = [
    {
      header: "Aluno",
      cell: (invoice) => (
        <Link
          href={`/dashboard/financeiro/cobrancas/${invoice.id}`}
          className="font-medium text-indigo-700 hover:underline"
        >
          {invoice.studentName}
        </Link>
      ),
    },
    { header: "Curso", cell: (invoice) => invoice.courseName ?? "—" },
    { header: "Vencimento", cell: (invoice) => formatDateOnly(invoice.due_date) },
    { header: "Valor", cell: (invoice) => formatMoney(invoice.final_value) },
    { header: "Pago", cell: (invoice) => formatMoney(invoice.paidAmount) },
    {
      header: "Forma",
      cell: (invoice) =>
        invoice.latestPaymentMethod
          ? PAYMENT_METHOD_LABELS[invoice.latestPaymentMethod]
          : "—",
    },
    { header: "Status", cell: (invoice) => <InvoiceStatusBadge status={invoice.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Mensalidades, cobranças, pagamentos e relatórios financeiros."
        action={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/financeiro/planos/novo">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" /> Plano
                </Button>
              </Link>
              <Link href="/dashboard/financeiro/cobrancas/gerar">
                <Button>
                  <Receipt className="h-4 w-4" /> Gerar mensalidades
                </Button>
              </Link>
            </div>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Em aberto"
          value={formatMoney(stats.openAmount)}
          icon={Wallet}
          hint={`${stats.openCount + stats.partialCount} cobrança(s)`}
          tone="sky"
        />
        <StatCard
          label="Vencido"
          value={formatMoney(stats.overdueAmount)}
          icon={AlertTriangle}
          hint={`${stats.overdueCount} cobrança(s)`}
          tone="rose"
        />
        <StatCard
          label="Recebido no mês"
          value={formatMoney(stats.receivedMonth)}
          icon={Banknote}
          hint={`${stats.paidCount} cobrança(s) pagas`}
          tone="emerald"
        />
        <StatCard
          label="Parciais"
          value={stats.partialCount}
          icon={FileText}
          hint={INVOICE_STATUS_LABELS.partial}
          tone="amber"
        />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/dashboard/financeiro/cobrancas" className="block">
          <Card className="p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
            <CardTitle>Cobranças</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Listagem, filtros e detalhes.</p>
          </Card>
        </Link>
        {canManage && (
          <Link href="/dashboard/financeiro/planos" className="block">
            <Card className="p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
              <CardTitle>Planos</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Valores, bolsas e parcelas.</p>
            </Card>
          </Link>
        )}
        {canManage && (
          <Link href="/dashboard/financeiro/cobrancas/gerar" className="block">
            <Card className="p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
              <CardTitle>Mensalidades</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Vincular plano à matrícula.</p>
            </Card>
          </Link>
        )}
        <Link href="/dashboard/financeiro/relatorios" className="block">
          <Card className="p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
            <CardTitle>Relatórios</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Resumo por status e pagamento.</p>
          </Card>
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Cobranças recentes</h2>
        <DataTable
          columns={columns}
          data={recent}
          getRowKey={(invoice) => invoice.id}
          emptyIcon={Receipt}
          emptyTitle="Nenhuma cobrança"
          emptyDescription="As cobranças geradas aparecerão aqui."
        />
      </section>
    </>
  );
}
