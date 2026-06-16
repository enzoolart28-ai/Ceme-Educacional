import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listUnits } from "@/lib/aula-teste/queries";
import { PageHeader } from "@/components/ui/page-header";
import { ReportCreateForm } from "@/components/aula-teste/report-create-form";

export default async function NovoRelatorioAulaTestePage() {
  await requirePermission("aulateste.manage");
  const units = await listUnits();

  return (
    <>
      <Link href="/dashboard/aula-teste" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para relatórios
      </Link>
      <PageHeader
        title="Novo relatório de aula-teste"
        description="Cadastre o candidato e os dados básicos da vaga. As demais etapas são preenchidas em seguida."
      />
      <ReportCreateForm units={units} />
    </>
  );
}
