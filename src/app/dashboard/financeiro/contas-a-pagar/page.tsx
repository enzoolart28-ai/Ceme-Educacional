import Link from "next/link";
import { ChevronLeft, ChevronRight, Wallet, CheckCircle2, Clock, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getMonthlyPayables,
  listExpenseCategories,
  listPayees,
} from "@/lib/payables/queries";
import { PAYABLE_STATUS_LABELS, PAYABLE_STATUS_BADGE, monthName } from "@/lib/payables/labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PayableCreateForm } from "@/components/payables/payable-create-form";
import { PayableRowActions } from "@/components/payables/payable-row-actions";

export default async function ContasAPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const profile = await requirePermission("finance.read");
  const canManage = hasPermission(profile.role, "finance.manage");

  const now = new Date();
  const sp = await searchParams;
  const year = Number(sp.ano) || now.getFullYear();
  const month = Number(sp.mes) || now.getMonth() + 1;

  const [data, categories, payees] = await Promise.all([
    getMonthlyPayables(year, month),
    listExpenseCategories(),
    listPayees(),
  ]);

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <>
      <PageHeader
        title="Contas a Pagar"
        description="Controle de despesas mensais por categoria, favorecido e status."
        action={
          <Link
            href="/dashboard/financeiro/contas-a-pagar/favorecidos"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Users className="h-4 w-4" /> Favorecidos
          </Link>
        }
      />

      {/* Navegação de mês */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <Link href={`?ano=${prev.y}&mes=${prev.m}`} className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50" aria-label="Mês anterior">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="min-w-44 text-center text-lg font-semibold text-slate-900">
          {monthName(month)} / {year}
        </span>
        <Link href={`?ano=${next.y}&mes=${next.m}`} className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50" aria-label="Próximo mês">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total a pagar no mês" value={formatCurrency(data.grandTotal)} icon={Wallet} tone="indigo" />
        <StatCard label="Já pago" value={formatCurrency(data.paidTotal)} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Em aberto" value={formatCurrency(data.pendingTotal)} icon={Clock} tone="amber" />
      </div>

      {/* Por categoria */}
      {data.byCategory.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Resumo por categoria</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {data.byCategory.map((c) => (
              <div key={c.categoryId} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-sm font-medium text-slate-800">{c.categoryName}</span>
                <span className="text-right text-sm">
                  <span className="font-semibold text-slate-900">{formatCurrency(c.total)}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    ({formatCurrency(c.paid)} pago · {formatCurrency(c.pending)} aberto)
                  </span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista de contas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Contas de {monthName(month)}</CardTitle>
        </CardHeader>
        {data.rows.length === 0 ? (
          <CardContent>
            <EmptyState icon={Wallet} title="Nenhuma conta neste mês" description="Adicione a primeira conta abaixo." />
          </CardContent>
        ) : (
          <CardContent className="divide-y divide-slate-100 p-0">
            {data.rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {r.description}
                    <span className="ml-2 text-xs font-normal text-slate-400">{r.categoryName}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {r.payeeName ? r.payeeName : "—"}
                    {r.pixKey ? ` · PIX: ${r.pixKey}` : ""}
                    {r.due_date ? ` · vence ${formatDate(r.due_date)}` : ""}
                    {r.notes ? ` · ${r.notes}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(r.amount)}</span>
                <Badge className={PAYABLE_STATUS_BADGE[r.effectiveStatus]}>
                  {PAYABLE_STATUS_LABELS[r.effectiveStatus]}
                </Badge>
                {canManage && <PayableRowActions id={r.id} status={r.status} />}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {canManage && (
        <PayableCreateForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          payees={payees.map((p) => ({ id: p.id, name: p.name }))}
          year={year}
          month={month}
        />
      )}
    </>
  );
}
