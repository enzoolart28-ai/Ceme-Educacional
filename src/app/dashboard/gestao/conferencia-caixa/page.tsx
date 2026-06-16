import { Landmark } from "lucide-react";
import { GESTOR_ROLES, requireRole } from "@/lib/auth/session";
import { listCashSessions } from "@/lib/cash/queries";
import { CASH_SESSION_STATUS_LABELS } from "@/lib/cash/labels";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ReviewCashSessionForm } from "@/components/cash/cash-forms";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";

type SessionRow = Awaited<ReturnType<typeof listCashSessions>>[number];

export default async function ConferenciaCaixaPage() {
  await requireRole(GESTOR_ROLES);
  const sessions = await listCashSessions();
  const columns: Column<SessionRow>[] = [
    { header: "Caixa", cell: (row) => row.cashRegisterName },
    { header: "Responsavel", cell: (row) => row.openedByName },
    { header: "Abertura", cell: (row) => formatDateTime(row.openedAt) },
    { header: "Esperado", cell: (row) => row.expectedClosingBalance == null ? "-" : formatCurrency(row.expectedClosingBalance) },
    { header: "Informado", cell: (row) => row.informedClosingBalance == null ? "-" : formatCurrency(row.informedClosingBalance) },
    { header: "Diferenca", cell: (row) => row.difference == null ? "-" : formatCurrency(row.difference) },
    { header: "Status", cell: (row) => CASH_SESSION_STATUS_LABELS[row.status as keyof typeof CASH_SESSION_STATUS_LABELS] ?? row.status },
    { header: "Conferencia", cell: (row) => <ReviewCashSessionForm sessionId={row.id} /> },
  ];

  return (
    <>
      <PageHeader title="Conferencia de Caixa" description="Caixas abertos, fechamentos e divergencias para analise do Gestor." />
      <DataTable
        columns={columns}
        data={sessions}
        getRowKey={(row) => row.id}
        emptyIcon={Landmark}
        emptyTitle="Sem caixas"
        emptyDescription="Nenhum caixa aberto ou fechado para conferencia."
      />
    </>
  );
}

