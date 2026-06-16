import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listCashSessions } from "@/lib/cash/queries";
import { getFinancialRequestById } from "@/lib/financial-requests/queries";
import { FINANCIAL_REQUEST_PRIORITY_LABELS, FINANCIAL_REQUEST_STATUS_LABELS } from "@/lib/financial-requests/labels";
import { ManagerDecisionForm, PaymentRequestForm } from "@/components/financial-requests/request-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function money(value: number | null) {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function SolicitacaoFinanceiraDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["admin", "diretor", "gestor", "financeiro", "coordenacao", "secretaria", "professor"]);
  const { id } = await params;
  const [request, sessions] = await Promise.all([
    getFinancialRequestById(id),
    listCashSessions("open"),
  ]);
  if (!request) notFound();

  return (
    <>
      <PageHeader title={request.title} description="Detalhe da solicitacao financeira." />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <p><span className="font-medium">Status:</span> <Badge>{FINANCIAL_REQUEST_STATUS_LABELS[request.status as keyof typeof FINANCIAL_REQUEST_STATUS_LABELS] ?? request.status}</Badge></p>
            <p><span className="font-medium">Prioridade:</span> {FINANCIAL_REQUEST_PRIORITY_LABELS[request.priority as keyof typeof FINANCIAL_REQUEST_PRIORITY_LABELS] ?? request.priority}</p>
            <p><span className="font-medium">Solicitante:</span> {request.requesterName}</p>
            <p><span className="font-medium">Setor:</span> {request.departmentName ?? "-"}</p>
            <p><span className="font-medium">Valor solicitado:</span> {money(request.requestedAmount)}</p>
            <p><span className="font-medium">Valor aprovado:</span> {money(request.approvedAmount)}</p>
            <p><span className="font-medium">Valor pago:</span> {money(request.paidAmount)}</p>
            <p><span className="font-medium">Beneficiario:</span> {request.beneficiaryName ?? "-"}</p>
            <p className="md:col-span-2"><span className="font-medium">Justificativa:</span> {request.justification ?? "-"}</p>
            <p className="md:col-span-2"><span className="font-medium">Parecer do gestor:</span> {request.managerReason ?? "-"}</p>
          </CardContent>
        </Card>
        <div className="space-y-6">
          {hasPermission(profile.role, "financial_requests.approve") && (
            <ManagerDecisionForm requestId={request.id} />
          )}
          {hasPermission(profile.role, "financial_requests.pay") && (
            <PaymentRequestForm requestId={request.id} sessions={sessions} />
          )}
        </div>
      </div>
    </>
  );
}
