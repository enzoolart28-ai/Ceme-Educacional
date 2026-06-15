import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Users, Gift, Trophy, Layers, Clock, Target } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import {
  getCampaign,
  getCampaignLevels,
  getCampaignParticipants,
  getCampaignReport,
  type ParticipantFilters,
} from "@/lib/campaigns/queries";
import { CAMPAIGN_STATUS_BADGE, campaignStatusLabel } from "@/lib/campaigns/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { LevelManager } from "@/components/campaigns/level-manager";
import { ParticipantManager } from "@/components/campaigns/participant-manager";
import { ParticipantFilters as ParticipantFiltersForm } from "@/components/campaigns/campaign-filters";
import { CampaignDeleteButton } from "@/components/campaigns/campaign-delete-button";
import type { CampaignStatus } from "@/types/models";

function parseFilters(sp: Record<string, string | string[] | undefined>): ParticipantFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const num = (v: string | string[] | undefined) => {
    const s = one(v);
    return s && /^\d+$/.test(s) ? Number(s) : undefined;
  };
  return {
    minAge: num(sp.minAge),
    maxAge: num(sp.maxAge),
    school: one(sp.school) || undefined,
    city: one(sp.city) || undefined,
    level: num(sp.level),
  };
}

export default async function CampanhaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  await requirePermission("campaigns.manage");

  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const filters = parseFilters(sp);
  const [levels, participants, report] = await Promise.all([
    getCampaignLevels(id),
    getCampaignParticipants(id, filters),
    getCampaignReport(id),
  ]);

  const dateLabel = [campaign.start_date, campaign.end_date]
    .filter(Boolean)
    .map((d) => formatDate(d as string))
    .join(" até ");

  return (
    <>
      <Link href="/dashboard/campanhas" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para campanhas
      </Link>
      <PageHeader
        title={campaign.name}
        description={campaign.target_audience ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge className={CAMPAIGN_STATUS_BADGE[campaign.status as CampaignStatus]}>
              {campaignStatusLabel(campaign.status as CampaignStatus)}
            </Badge>
            <Link href={`/dashboard/campanhas/${id}/editar`}>
              <Button variant="outline"><Pencil className="h-4 w-4" /> Editar</Button>
            </Link>
            <CampaignDeleteButton id={id} />
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {dateLabel && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {dateLabel}</span>}
          {campaign.target_audience && <span className="inline-flex items-center gap-1"><Target className="h-4 w-4" /> {campaign.target_audience}</span>}
        </CardContent>
      </Card>

      {(campaign.description || campaign.rules || campaign.prizes) && (
        <Card className="mb-4">
          <CardContent className="space-y-3 text-sm text-slate-700">
            {campaign.description && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Descrição</p><p className="whitespace-pre-wrap">{campaign.description}</p></div>}
            {campaign.rules && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Regras</p><p className="whitespace-pre-wrap">{campaign.rules}</p></div>}
            {campaign.prizes && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prêmios</p><p className="whitespace-pre-wrap">{campaign.prizes}</p></div>}
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Participantes" value={report.total} icon={Users} tone="indigo" />
        <StatCard label="Níveis" value={levels.length} icon={Layers} tone="sky" />
        <StatCard label="Elegíveis sorteio" value={report.eligible} icon={Gift} tone="amber" />
        <StatCard label="Ganhadores" value={report.winners} icon={Trophy} tone="emerald" />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Níveis do desafio</h2>
      <div className="mb-6">
        <LevelManager campaignId={id} levels={levels} />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Participantes e ranking</h2>
      <ParticipantFiltersForm />
      <ParticipantManager campaignId={id} participants={participants} levels={levels} />
    </>
  );
}
