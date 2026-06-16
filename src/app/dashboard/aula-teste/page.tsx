import Link from "next/link";
import { Plus, Settings, ClipboardCheck, GraduationCap } from "lucide-react";
import { requirePermission, getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listReports, listUnits, type ReportFilters } from "@/lib/aula-teste/queries";
import {
  AT_REPORT_STATUS_BADGE,
  AT_PROCESS_STATUS_BADGE,
  atReportStatusLabel,
  atProcessStatusLabel,
} from "@/lib/aula-teste/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportFilters as ReportFiltersForm } from "@/components/aula-teste/report-filters";
import type { AtProcessStatus, AtReportStatus } from "@/types/models";

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AulaTesteListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("aulateste.evaluate");
  const profile = await getProfile();
  const canManage = profile ? hasPermission(profile.role, "aulateste.manage") : false;
  const sp = await searchParams;

  const filters: ReportFilters = {
    q: one(sp.q),
    unitId: one(sp.unit),
    processStatus: one(sp.process) as AtProcessStatus | undefined,
  };
  const [reports, units] = await Promise.all([listReports(filters), listUnits()]);

  return (
    <>
      <PageHeader
        title="Relatórios de Aula-Teste"
        description="Avaliação de candidatos a professor durante a aula-teste."
        action={
          canManage ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard/configuracoes/aula-teste">
                <Button variant="outline"><Settings className="h-4 w-4" /> Configurações</Button>
              </Link>
              <Link href="/dashboard/aula-teste/novo">
                <Button><Plus className="h-4 w-4" /> Novo relatório</Button>
              </Link>
            </div>
          ) : undefined
        }
      />

      <ReportFiltersForm units={units} />

      {reports.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nenhum relatório" description="Crie o primeiro relatório de aula-teste." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {reports.map((r) => (
            <Link key={r.id} href={`/dashboard/aula-teste/${r.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {r.candidateName} <span className="text-xs font-normal text-slate-400">· {r.code}</span>
                </p>
                <p className="truncate text-xs text-slate-500">
                  {[r.position_title, r.discipline, r.unitName, r.test_date ? formatDate(r.test_date) : null].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              {r.final_score != null && (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{Number(r.final_score).toFixed(1)}</span>
              )}
              <Badge className={AT_PROCESS_STATUS_BADGE[r.process_status as AtProcessStatus]}>{atProcessStatusLabel(r.process_status as AtProcessStatus)}</Badge>
              <Badge className={AT_REPORT_STATUS_BADGE[r.status as AtReportStatus]}>{atReportStatusLabel(r.status as AtReportStatus)}</Badge>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
