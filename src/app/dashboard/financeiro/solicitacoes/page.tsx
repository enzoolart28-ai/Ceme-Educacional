import Link from "next/link";
import { ClipboardSignature } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listCashRegisters } from "@/lib/cash/queries";
import { listFinancialRequests } from "@/lib/financial-requests/queries";
import { FINANCIAL_REQUEST_PRIORITY_LABELS, FINANCIAL_REQUEST_STATUS_LABELS } from "@/lib/financial-requests/labels";
import { listDepartments } from "@/lib/management/queries";
import { FinancialRequestForm } from "@/components/financial-requests/request-form";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RequestRow = Awaited<ReturnType<typeof listFinancialRequests>>[number];

function money(value: number | null) {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function SolicitacoesFinanceirasPage() {
  const profile = await requireRole(["admin", "diretor", "gestor", "coordenacao", "secretaria", "financeiro", "professor"]);
  const [departments, registers, requests] = await Promise.all([
    listDepartments(),
    listCashRegisters(),
    listFinancialRequests(),
  ]);

  const columns: Column<RequestRow>[] = [
    { header: "Titulo", cell: (row) => row.title },
    { header: "Solicitante", cell: (row) => row.requesterName },
    { header: "Valor", cell: (row) => money(row.requestedAmount) },
    { header: "Prioridade", cell: (row) => FINANCIAL_REQUEST_PRIORITY_LABELS[row.priority as keyof typeof FINANCIAL_REQUEST_PRIORITY_LABELS] ?? row.priority },
    { header: "Status", cell: (row) => <Badge>{FINANCIAL_REQUEST_STATUS_LABELS[row.status as keyof typeof FINANCIAL_REQUEST_STATUS_LABELS] ?? row.status}</Badge> },
    {
      header: "Acoes",
      cell: (row) => (
        <Link href={`/dashboard/financeiro/solicitacoes/${row.id}`}>
          <Button size="sm" variant="outline">Abrir</Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Solicitacoes Financeiras" description="Pedidos internos de saida de dinheiro com aprovacao gerencial." />
      {hasPermission(profile.role, "financial_requests.create") && (
        <div className="mb-6">
          <FinancialRequestForm departments={departments} units={registers} />
        </div>
      )}
      <DataTable
        columns={columns}
        data={requests}
        getRowKey={(row) => row.id}
        emptyIcon={ClipboardSignature}
        emptyTitle="Sem solicitacoes"
        emptyDescription="Solicitacoes criadas pela equipe aparecerao aqui."
      />
    </>
  );
}
