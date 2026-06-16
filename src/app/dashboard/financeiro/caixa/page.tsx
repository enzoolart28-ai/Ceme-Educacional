import { Landmark } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listCashMovements, listCashRegisters, listCashSessions } from "@/lib/cash/queries";
import { CASH_MOVEMENT_TYPE_LABELS } from "@/lib/cash/labels";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import { OpenCashSessionForm, CashMovementForm, CloseCashSessionForm } from "@/components/cash/cash-forms";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

type MovementRow = Awaited<ReturnType<typeof listCashMovements>>[number];

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CaixaFinanceiroPage() {
  await requireRole(["admin", "diretor", "financeiro"]);
  const [registers, openSessions, movements] = await Promise.all([
    listCashRegisters(),
    listCashSessions("open"),
    listCashMovements(),
  ]);

  const columns: Column<MovementRow>[] = [
    { header: "Tipo", cell: (row) => CASH_MOVEMENT_TYPE_LABELS[row.type as keyof typeof CASH_MOVEMENT_TYPE_LABELS] ?? row.type },
    { header: "Categoria", cell: (row) => row.category },
    { header: "Valor", cell: (row) => money(row.amount) },
    { header: "Forma", cell: (row) => PAYMENT_METHOD_LABELS[row.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? row.paymentMethod },
    { header: "Status", cell: (row) => <Badge>{row.status}</Badge> },
    { header: "Responsavel", cell: (row) => row.createdByName },
  ];

  return (
    <>
      <PageHeader title="Caixa" description="Abertura, movimentacao e fechamento operacional do caixa." />
      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <OpenCashSessionForm registers={registers} />
        <CashMovementForm sessions={openSessions} />
        <CloseCashSessionForm sessions={openSessions} />
      </div>
      <DataTable
        columns={columns}
        data={movements}
        getRowKey={(row) => row.id}
        emptyIcon={Landmark}
        emptyTitle="Sem movimentacoes"
        emptyDescription="As entradas e saidas do caixa aparecerao aqui."
      />
    </>
  );
}
