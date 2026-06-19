import Link from "next/link";
import { UserMinus, UserX, ArrowLeftRight, TrendingDown, GraduationCap } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getDropoutReport, type DropoutType } from "@/lib/desistencias/queries";
import { STUDENT_STATUS_BADGE, studentStatusLabel } from "@/lib/students/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DropoutExport } from "@/components/desistencias/dropout-export";
import type { StudentStatus } from "@/types/models";

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const TABS: { key: string; label: string; type?: DropoutType }[] = [
  { key: "todos", label: "Todos" },
  { key: "dropout", label: "Desistentes", type: "dropout" },
  { key: "transferred", label: "Transferidos", type: "transferred" },
];

export default async function DesistenciasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("students.read");
  const tipo = one((await searchParams).tipo);
  const type = tipo === "dropout" || tipo === "transferred" ? (tipo as DropoutType) : undefined;
  const report = await getDropoutReport({ type });

  return (
    <>
      <PageHeader
        title="Relatório de Desistências"
        description="Acompanhamento da evasão: alunos desistentes e transferidos."
        action={<DropoutExport rows={report.rows} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Desistentes" value={report.dropoutCount} icon={UserX} tone="rose" />
        <StatCard label="Transferidos" value={report.transferredCount} icon={ArrowLeftRight} tone="sky" />
        <StatCard label="Total de saídas" value={report.rows.length} icon={UserMinus} tone="amber" />
        <StatCard label="Taxa de desistência" value={`${report.rate}%`} icon={TrendingDown} tone="violet" />
      </div>

      {/* Filtro por tipo */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = (t.key === "todos" && !type) || t.type === type;
          return (
            <Link
              key={t.key}
              href={t.type ? `/dashboard/desistencias?tipo=${t.type}` : "/dashboard/desistencias"}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Por curso */}
      {report.byCourse.length > 0 && (
        <Card className="mb-4">
          <CardContent>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <GraduationCap className="h-4 w-4 text-indigo-500" /> Saídas por curso
            </h2>
            <div className="space-y-2">
              {report.byCourse.map((c) => {
                const pct = report.rows.length ? Math.round((c.count / report.rows.length) * 100) : 0;
                return (
                  <div key={c.courseName} className="flex items-center gap-3">
                    <span className="w-44 shrink-0 truncate text-sm text-slate-700">{c.courseName}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-semibold text-slate-700">{c.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {report.rows.length === 0 ? (
        <EmptyState icon={UserMinus} title="Nenhuma desistência" description="Não há alunos desistentes ou transferidos neste filtro." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {report.rows.map((r) => (
            <Link key={r.id} href={`/dashboard/alunos/${r.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{r.studentName}</p>
                <p className="truncate text-xs text-slate-500">
                  {[r.courseName, r.className].filter(Boolean).join(" · ") || "Sem turma"}
                  {r.reason ? ` · ${r.reason}` : ""}
                </p>
              </div>
              <span className="text-xs text-slate-400">{formatDate(r.date)}</span>
              <Badge className={STUDENT_STATUS_BADGE[r.status as StudentStatus]}>{studentStatusLabel(r.status as StudentStatus)}</Badge>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
