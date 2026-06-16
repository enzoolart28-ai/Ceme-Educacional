import { ClipboardCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listCashSessions } from "@/lib/cash/queries";
import { CASH_SESSION_STATUS_LABELS } from "@/lib/cash/labels";
import { CloseCashSessionForm } from "@/components/cash/cash-forms";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

type SessionRow = Awaited<ReturnType<typeof listCashSessions>>[number];

function money(value: number | null) {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FechamentoCaixaPage() {
  await requireRole(["admin", "diretor", "financeiro"]);
  const [openSessions, sessions] = await Promise.all([listCashSessions("open"), listCashSessions()]);
  const columns: Column<SessionRow>[] = [
    { header: "Caixa", cell: (row) => row.cashRegisterName },
    { header: "Aberto por", cell: (row) => row.openedByName },
    { header: "Saldo inicial", cell: (row) => money(row.openingBalance) },
    { header: "Saldo contado", cell: (row) => money(row.informedClosingBalance) },
    { header: "Diferenca", cell: (row) => money(row.difference) },
    { header: "Status", cell: (row) => <Badge>{CASH_SESSION_STATUS_LABELS[row.status as keyof typeof CASH_SESSION_STATUS_LABELS] ?? row.status}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Fechamento de Caixa" description="Fechamento operacional para posterior conferencia do gestor." />
      <div className="mb-6">
        <CloseCashSessionForm sessions={openSessions} />
      </div>
      <DataTable
        columns={columns}
        data={sessions}
        getRowKey={(row) => row.id}
        emptyIcon={ClipboardCheck}
        emptyTitle="Sem caixas"
        emptyDescription="Os caixas abertos e fechados aparecerao aqui."
      />
    </>
  );
}
