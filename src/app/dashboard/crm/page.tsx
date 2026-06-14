import Link from "next/link";
import { Plus, BarChart3, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listLeads } from "@/lib/crm/queries";
import {
  KANBAN_STATUSES,
  STATUS_LABELS,
  STATUS_BADGE,
  SOURCE_LABELS,
  statusLabel,
} from "@/lib/crm/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CrmFilters } from "@/components/crm/crm-filters";
import type { Lead, LeadSource, LeadStatus } from "@/types/models";

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link href={`/dashboard/crm/${lead.id}`} className="block rounded-lg border border-slate-200 bg-white p-3 hover:border-indigo-300 hover:shadow-sm">
      <p className="truncate font-medium text-slate-900">{lead.full_name}</p>
      {lead.course_interest && <p className="truncate text-xs text-slate-500">{lead.course_interest}</p>}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>{SOURCE_LABELS[lead.source as LeadSource]}</span>
        {lead.phone && <span>{lead.phone}</span>}
      </div>
    </Link>
  );
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission("leads.manage");
  const sp = await searchParams;
  const view = sp.view === "lista" ? "lista" : "kanban";

  const leads = await listLeads({
    q: sp.q,
    course: sp.course,
    status: sp.status as LeadStatus | undefined,
    source: sp.source as LeadSource | undefined,
  });

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v) params.set(k, v);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    return `/dashboard/crm?${params.toString()}`;
  }
  const tab = (v: string) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${view === v ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <>
      <PageHeader
        title="Comercial (CRM)"
        description="Leads, atendimentos e conversão em matrícula."
        action={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/crm/relatorios"><Button variant="outline"><BarChart3 className="h-4 w-4" /> Relatórios</Button></Link>
            <Link href="/dashboard/crm/novo"><Button><Plus className="h-4 w-4" /> Novo lead</Button></Link>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-1 rounded-lg bg-slate-100 p-1 sm:w-fit">
        <Link href={buildUrl({ view: "kanban" })} className={tab("kanban")}>Kanban</Link>
        <Link href={buildUrl({ view: "lista" })} className={tab("lista")}>Lista</Link>
      </div>

      <CrmFilters />

      {leads.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum lead" description="Cadastre o primeiro interessado." />
      ) : view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {KANBAN_STATUSES.map((st) => {
            const colLeads = leads.filter((l) => l.status === st);
            return (
              <div key={st} className="w-64 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-slate-700">{STATUS_LABELS[st]}</span>
                  <span className="rounded-full bg-slate-100 px-2 text-xs text-slate-500">{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map((l) => <LeadCard key={l.id} lead={l} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="divide-y divide-slate-100">
          {leads.map((l) => (
            <Link key={l.id} href={`/dashboard/crm/${l.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{l.full_name}</p>
                <p className="truncate text-xs text-slate-500">
                  {l.course_interest ?? "—"} · {SOURCE_LABELS[l.source as LeadSource]}
                  {l.phone ? ` · ${l.phone}` : ""}
                  {l.city ? ` · ${l.city}` : ""}
                </p>
              </div>
              <Badge className={STATUS_BADGE[l.status as LeadStatus]}>{statusLabel(l.status as LeadStatus)}</Badge>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
