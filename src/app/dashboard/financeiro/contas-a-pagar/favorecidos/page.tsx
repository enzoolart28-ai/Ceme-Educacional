import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listPayees } from "@/lib/payables/queries";
import { PAYEE_TYPE_LABELS } from "@/lib/payables/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PayeeCreateForm } from "@/components/payables/payee-create-form";
import { PayeeRemoveButton } from "@/components/payables/payee-remove-button";

export default async function FavorecidosPage() {
  const profile = await requirePermission("finance.read");
  const canManage = hasPermission(profile.role, "finance.manage");
  const payees = await listPayees();

  return (
    <>
      <Link
        href="/dashboard/financeiro/contas-a-pagar"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para Contas a Pagar
      </Link>

      <PageHeader title="Favorecidos" description="Pessoas e fornecedores que recebem pagamentos, com chave PIX." />

      {canManage && (
        <div className="mb-6">
          <PayeeCreateForm />
        </div>
      )}

      <Card>
        {payees.length === 0 ? (
          <CardContent>
            <EmptyState icon={Users} title="Nenhum favorecido" description="Cadastre o primeiro favorecido acima." />
          </CardContent>
        ) : (
          <CardContent className="divide-y divide-slate-100 p-0">
            {payees.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">{p.pix_key ? `PIX: ${p.pix_key}` : "Sem PIX cadastrado"}</p>
                </div>
                <Badge className="bg-slate-100 text-slate-700">{PAYEE_TYPE_LABELS[p.type]}</Badge>
                {canManage && <PayeeRemoveButton id={p.id} />}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </>
  );
}
