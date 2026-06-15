import Link from "next/link";
import { Plus, Trophy, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listCampaigns } from "@/lib/campaigns/queries";
import { CAMPAIGN_STATUS_BADGE, campaignStatusLabel } from "@/lib/campaigns/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { CampaignStatus } from "@/types/models";

export default async function CampanhasPage() {
  await requirePermission("campaigns.manage");
  const campaigns = await listCampaigns();

  return (
    <>
      <PageHeader
        title="Campanhas e Desafios"
        description="Campanhas educacionais, desafios por nível e sorteios."
        action={
          <Link href="/dashboard/campanhas/novo">
            <Button><Plus className="h-4 w-4" /> Nova campanha</Button>
          </Link>
        }
      />
      {campaigns.length === 0 ? (
        <EmptyState icon={Trophy} title="Nenhuma campanha" description="Crie a primeira campanha/desafio." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/dashboard/campanhas/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.start_date ? formatDate(c.start_date) : "—"}
                  {c.end_date ? ` até ${formatDate(c.end_date)}` : ""}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Users className="h-3 w-3" /> {c.participantCount}</span>
              <Badge className={CAMPAIGN_STATUS_BADGE[c.status as CampaignStatus]}>{campaignStatusLabel(c.status as CampaignStatus)}</Badge>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
