import Link from "next/link";
import { ArrowLeft, Users, GraduationCap, Percent } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getCrmReports } from "@/lib/crm/queries";
import { SOURCE_LABELS, STATUS_LABELS, STATUS_BADGE } from "@/lib/crm/labels";
import { formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LeadSource, LeadStatus } from "@/types/models";

function Bar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function CrmRelatoriosPage() {
  await requirePermission("leads.manage");
  const r = await getCrmReports();

  return (
    <>
      <Link href="/dashboard/crm" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para o CRM
      </Link>
      <PageHeader title="Relatórios do CRM" description="Conversão, origem e curso de interesse." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total de leads" value={r.total} icon={Users} tone="indigo" />
        <StatCard label="Matriculados" value={r.converted} icon={GraduationCap} tone="emerald" />
        <StatCard label="Taxa de conversão" value={formatPercent(r.conversionRate)} icon={Percent} tone="sky" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Por status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {r.byStatus.length === 0 ? <p className="text-sm text-slate-400">Sem dados.</p> :
              r.byStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <Badge className={STATUS_BADGE[s.status as LeadStatus]}>{STATUS_LABELS[s.status as LeadStatus]}</Badge>
                  <span className="font-medium text-slate-700">{s.count}</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Por origem</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {r.bySource.length === 0 ? <p className="text-sm text-slate-400">Sem dados.</p> :
              r.bySource.map((s) => (
                <div key={s.source}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{SOURCE_LABELS[s.source as LeadSource]}</span>
                    <span className="text-xs text-slate-500">{s.total} ({s.converted} matric.)</span>
                  </div>
                  <Bar value={s.total} total={r.total} />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Por curso de interesse</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {r.byCourse.length === 0 ? <p className="text-sm text-slate-400">Sem dados.</p> :
              r.byCourse.map((c) => (
                <div key={c.course}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate text-slate-700">{c.course}</span>
                    <span className="text-xs text-slate-500">{c.total}</span>
                  </div>
                  <Bar value={c.total} total={r.total} />
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
