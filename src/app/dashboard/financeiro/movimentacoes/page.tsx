import { ArrowUpDown } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listCashMovements } from "@/lib/cash/queries";
import { CASH_MOVEMENT_TYPE_LABELS } from "@/lib/cash/labels";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

type MovementRow = Awaited<ReturnType<typeof listCashMovements>>[number];

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function MovimentacoesFinanceirasPage() {
  await requireRole(["admin", "diretor", "gestor", "financeiro"]);
  const movements = await listCashMovements();
  const columns: Column<MovementRow>[] = [
    { header: "Data", cell: (row) => new Date(row.createdAt).toLocaleString("pt-BR") },
    { header: "Tipo", cell: (row) => CASH_MOVEMENT_TYPE_LABELS[row.type as keyof typeof CASH_MOVEMENT_TYPE_LABELS] ?? row.type },
    { header: "Categoria", cell: (row) => row.category },
    { header: "Valor", cell: (row) => money(row.amount) },
    { header: "Forma", cell: (row) => PAYMENT_METHOD_LABELS[row.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? row.paymentMethod },
    { header: "Status", cell: (row) => <Badge>{row.status}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Movimentacoes Financeiras" description="Historico de entradas, reforcos, saidas, sangrias e ajustes." />
      <DataTable
        columns={columns}
        data={movements}
        getRowKey={(row) => row.id}
        emptyIcon={ArrowUpDown}
        emptyTitle="Sem movimentacoes"
        emptyDescription="Nenhuma movimentacao de caixa registrada."
      />
    </>
  );
}
