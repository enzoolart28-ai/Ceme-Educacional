import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import {
  listFinanceEnrollmentOptions,
  listFinancialPlans,
} from "@/lib/finance/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { GenerateInvoicesForm } from "@/components/finance/generate-invoices-form";

export default async function GenerateInvoicesPage() {
  await requirePermission("finance.manage");
  const [plans, enrollments] = await Promise.all([
    listFinancialPlans(),
    listFinanceEnrollmentOptions(),
  ]);

  return (
    <>
      <Link href="/dashboard/financeiro/cobrancas">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </Link>
      <PageHeader
        title="Gerar mensalidades"
        description="Vincule um plano financeiro a uma matrícula."
      />
      <GenerateInvoicesForm plans={plans} enrollments={enrollments} />
    </>
  );
}

