import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getCampaign } from "@/lib/campaigns/queries";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import type { CampaignStatus } from "@/types/models";

export default async function EditarCampanhaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("campaigns.manage");
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  return (
    <>
      <Link href={`/dashboard/campanhas/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para a campanha
      </Link>
      <PageHeader title="Editar campanha" description={campaign.name} />
      <CampaignForm
        mode="edit"
        campaignId={id}
        defaultValues={{
          name: campaign.name,
          description: campaign.description ?? "",
          start_date: campaign.start_date ?? "",
          end_date: campaign.end_date ?? "",
          target_audience: campaign.target_audience ?? "",
          rules: campaign.rules ?? "",
          prizes: campaign.prizes ?? "",
          status: campaign.status as CampaignStatus,
        }}
      />
    </>
  );
}
