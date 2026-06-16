import { GitCompareArrows, ListChecks } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getCashFlowSummary, listCashMovements } from "@/lib/cash/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CASH_MOVEMENT_TYPE_LABELS } from "@/lib/cash/labels";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, type Column } from "@/components/ui/data-table";

type MovementRow = Awaited<ReturnType<typeof listCashMovements>>[number];

export default async function FluxoCaixaPage() {
  await requireRole(["admin", "diretor", "gestor", "financeiro"]);
  const [summary, movements] = await Promise.all([
    getCashFlowSummary(),
    listCashMovements(),
  ]);
  const columns: Column<MovementRow>[] = [
    { header: "Data", cell: (row) => formatDateTime(row.createdAt) },
    { header: "Tipo", cell: (row) => CASH_MOVEMENT_TYPE_LABELS[row.type as keyof typeof CASH_MOVEMENT_TYPE_LABELS] ?? row.type },
    { header: "Categoria", cell: (row) => row.category },
    { header: "Valor", cell: (row) => formatCurrency(row.amount) },
    { header: "Status", cell: (row) => row.status },
  ];

  return (
    <>
      <PageHeader title="Fluxo de Caixa" description="Entradas, saidas, saldo e movimentacoes realizadas." />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Saldo inicial aberto" value={formatCurrency(summary.openingBalance)} icon={GitCompareArrows} tone="slate" />
        <StatCard label="Entradas" value={formatCurrency(summary.entries)} icon={GitCompareArrows} tone="emerald" />
        <StatCard label="Saidas" value={formatCurrency(summary.exits)} icon={GitCompareArrows} tone="rose" />
        <StatCard label="Saldo final" value={formatCurrency(summary.finalBalance)} icon={GitCompareArrows} tone="sky" />
      </div>
      <DataTable
        columns={columns}
        data={movements}
        getRowKey={(row) => row.id}
        emptyIcon={ListChecks}
        emptyTitle="Sem movimentacoes"
        emptyDescription="As movimentacoes de caixa aparecerao aqui."
      />
    </>
  );
}

