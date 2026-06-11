import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { requireRole, FINANCE_ROLES } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getInvoiceById } from "@/lib/finance/queries";
import { formatDateOnly, formatMoney } from "@/lib/finance/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InvoiceStatusBadge } from "@/components/finance/invoice-status-badge";
import { PaymentForm } from "@/components/finance/payment-form";
import { InvoiceAdjustmentForm } from "@/components/finance/invoice-adjustment-form";
import { RenegotiationForm } from "@/components/finance/renegotiation-form";
import {
  CancelInvoiceButton,
  DeletePaymentButton,
} from "@/components/finance/invoice-danger-actions";
import type { PaymentRow } from "@/lib/finance/queries";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <div className="mt-1 text-sm text-slate-800">{value}</div>
    </div>
  );
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(FINANCE_ROLES);
  const canManage = hasPermission(profile.role, "finance.manage");
  const isAdmin = profile.role === "admin";
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const canReceive =
    canManage &&
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    invoice.status !== "renegotiated";

  const columns: Column<PaymentRow>[] = [
    { header: "Data", cell: (payment) => formatDateTime(payment.paid_at) },
    { header: "Valor", cell: (payment) => formatMoney(payment.amount) },
    { header: "Forma", cell: (payment) => PAYMENT_METHOD_LABELS[payment.payment_method] },
    { header: "Recebido por", cell: (payment) => payment.receivedByName ?? "—" },
    { header: "Obs.", cell: (payment) => payment.notes ?? "—" },
  ];

  if (isAdmin) {
    columns.push({
      header: "Ações",
      cell: (payment) => (
        <DeletePaymentButton paymentId={payment.id} invoiceId={invoice.id} />
      ),
    });
  }

  return (
    <>
      <Link href="/dashboard/financeiro/cobrancas">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </Link>

      <PageHeader
        title={`Cobrança de ${invoice.studentName}`}
        description={`${invoice.courseName ?? "Curso"} · vencimento ${formatDateOnly(invoice.due_date)}`}
        action={<InvoiceStatusBadge status={invoice.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da cobrança</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Detail label="Aluno" value={invoice.studentName} />
              <Detail label="Matrícula" value={invoice.enrollment_id?.slice(0, 8) ?? "—"} />
              <Detail label="Curso" value={invoice.courseName ?? "—"} />
              <Detail label="Turma" value={invoice.className ?? "—"} />
              <Detail label="Unidade" value={invoice.unitName ?? "—"} />
              <Detail label="Vencimento" value={formatDateOnly(invoice.due_date)} />
              <Detail label="Valor original" value={formatMoney(invoice.original_value)} />
              <Detail label="Desconto/bolsa" value={formatMoney(invoice.discount_value)} />
              <Detail label="Multa" value={formatMoney(invoice.fine_value)} />
              <Detail label="Juros" value={formatMoney(invoice.interest_value)} />
              <Detail label="Valor final" value={formatMoney(invoice.final_value)} />
              <Detail label="Valor pago" value={formatMoney(invoice.paidAmount)} />
              <Detail label="Saldo" value={formatMoney(invoice.remainingAmount)} />
              <Detail label="Data de pagamento" value={formatDateTime(invoice.paid_at)} />
              <Detail
                label="Forma de pagamento"
                value={
                  invoice.latestPaymentMethod
                    ? PAYMENT_METHOD_LABELS[invoice.latestPaymentMethod]
                    : "—"
                }
              />
              <div className="sm:col-span-3">
                <Detail label="Observações" value={invoice.notes ?? "—"} />
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-base font-semibold text-slate-900">Pagamentos</h2>
            <DataTable
              columns={columns}
              data={invoice.payments}
              getRowKey={(payment) => payment.id}
              emptyIcon={Receipt}
              emptyTitle="Nenhum pagamento"
              emptyDescription="Registre pagamentos para esta cobrança."
            />
          </div>
        </div>

        {canManage && (
          <div className="space-y-6">
            {canReceive && (
              <>
                <PaymentForm invoiceId={invoice.id} remainingAmount={invoice.remainingAmount} />
                <PaymentForm
                  invoiceId={invoice.id}
                  remainingAmount={invoice.remainingAmount}
                  mode="manual"
                />
              </>
            )}
            <InvoiceAdjustmentForm
              invoiceId={invoice.id}
              discountValue={invoice.discount_value}
              fineValue={invoice.fine_value}
              interestValue={invoice.interest_value}
              notes={invoice.notes ?? ""}
            />
            {canReceive && (
              <RenegotiationForm
                invoiceId={invoice.id}
                defaultAmount={invoice.remainingAmount || invoice.final_value}
              />
            )}
            {invoice.status !== "cancelled" && invoice.status !== "paid" && (
              <CancelInvoiceButton invoiceId={invoice.id} />
            )}
          </div>
        )}
      </div>
    </>
  );
}
