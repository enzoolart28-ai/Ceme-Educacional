import { FileClock } from "lucide-react";
import { GESTOR_ROLES, requireRole } from "@/lib/auth/session";
import { listManagementAuditLogs } from "@/lib/management/queries";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";

type AuditRow = Awaited<ReturnType<typeof listManagementAuditLogs>>[number];

export default async function AuditoriaGestaoPage() {
  await requireRole(GESTOR_ROLES);
  const logs = await listManagementAuditLogs();
  const columns: Column<AuditRow>[] = [
    { header: "Data", cell: (row) => new Date(row.createdAt).toLocaleString("pt-BR") },
    { header: "Usuario", cell: (row) => row.actorName },
    { header: "Acao", cell: (row) => row.action },
    { header: "Modulo", cell: (row) => row.entityType ?? "-" },
  ];

  return (
    <>
      <PageHeader title="Auditoria Gerencial" description="Logs de aprovações, caixa e eventos sensíveis." />
      <DataTable
        columns={columns}
        data={logs}
        getRowKey={(row) => row.id}
        emptyIcon={FileClock}
        emptyTitle="Sem logs"
        emptyDescription="As acoes sensiveis registradas aparecerao aqui."
      />
    </>
  );
}
