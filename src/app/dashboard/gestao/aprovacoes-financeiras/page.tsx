import Link from "next/link";
import { ClipboardSignature } from "lucide-react";
import { GESTOR_ROLES, requireRole } from "@/lib/auth/session";
import {
  getFinancialRequestSummary,
  listFinancialRequests,
} from "@/lib/financial-requests/queries";
import {
  FINANCIAL_REQUEST_PRIORITY_LABELS,
  FINANCIAL_REQUEST_STATUS_BADGE,
  FINANCIAL_REQUEST_STATUS_LABELS,
} from "@/lib/financial-requests/labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";

type RequestRow = Awaited<ReturnType<typeof listFinancialRequests>>[number];

export default async function AprovacoesFinanceirasPage() {
  await requireRole(GESTOR_ROLES);
  const [summary, requests] = await Promise.all([
    getFinancialRequestSummary(),
    listFinancialRequests(),
  ]);
  const columns: Column<RequestRow>[] = [
    { header: "Solicitacao", cell: (row) => <Link className="font-medium text-indigo-600" href={`/dashboard/financeiro/solicitacoes/${row.id}`}>{row.title}</Link> },
    { header: "Solicitante", cell: (row) => row.requesterName },
    { header: "Valor", cell: (row) => formatCurrency(row.requestedAmount) },
    { header: "Necessaria em", cell: (row) => formatDate(row.requiredDate) },
    { header: "Prioridade", cell: (row) => FINANCIAL_REQUEST_PRIORITY_LABELS[row.priority as keyof typeof FINANCIAL_REQUEST_PRIORITY_LABELS] ?? row.priority },
    {
      header: "Status",
      cell: (row) => (
        <Badge className={FINANCIAL_REQUEST_STATUS_BADGE[row.status as keyof typeof FINANCIAL_REQUEST_STATUS_BADGE]}>
          {FINANCIAL_REQUEST_STATUS_LABELS[row.status as keyof typeof FINANCIAL_REQUEST_STATUS_LABELS] ?? row.status}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Aprovações Financeiras" description="Análise e decisão sobre solicitações de saída financeira." />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Pendentes" value={summary.pending} icon={ClipboardSignature} tone="amber" />
        <StatCard label="Urgentes" value={summary.urgent} icon={ClipboardSignature} tone="rose" />
        <StatCard label="Aprovado" value={formatCurrency(summary.approvedAmount)} icon={ClipboardSignature} tone="emerald" />
        <StatCard label="Pago" value={formatCurrency(summary.paidAmount)} icon={ClipboardSignature} tone="sky" />
      </div>
      <DataTable
        columns={columns}
        data={requests}
        getRowKey={(row) => row.id}
        emptyIcon={ClipboardSignature}
        emptyTitle="Sem solicitacoes"
        emptyDescription="Solicitacoes enviadas aparecerao aqui."
      />
    </>
  );
}

