import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export default async function NovaCampanhaPage() {
  await requirePermission("campaigns.manage");

  return (
    <>
      <Link href="/dashboard/campanhas" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para campanhas
      </Link>
      <PageHeader title="Nova campanha" description="Crie uma campanha ou desafio educacional." />
      <CampaignForm
        mode="create"
        defaultValues={{
          name: "",
          description: "",
          start_date: "",
          end_date: "",
          target_audience: "",
          rules: "",
          prizes: "",
          status: "rascunho",
        }}
      />
    </>
  );
}
