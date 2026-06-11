import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, Percent, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getClassById } from "@/lib/classes/queries";
import { getClassFrequencyReport, type FrequencyRow } from "@/lib/attendance/queries";
import { LOW_FREQUENCY_THRESHOLD } from "@/lib/attendance/frequency";
import { formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, type Column } from "@/components/ui/data-table";

export default async function RelatorioFrequenciaPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  await requirePermission("classes.read");

  const turma = await getClassById(classId);
  if (!turma) notFound();
  const report = await getClassFrequencyReport(classId);

  const totalAttended = report.reduce((acc, r) => acc + r.summary.attended, 0);
  const totalSessions = report.reduce((acc, r) => acc + r.summary.total, 0);
  const turmaPercent = totalSessions > 0 ? totalAttended / totalSessions : null;
  const lowCount = report.filter((r) => r.summary.lowFrequency).length;

  const columns: Column<FrequencyRow>[] = [
    {
      header: "Aluno",
      cell: (r) => (
        <Link href={`/dashboard/alunos/${r.studentId}`} className="font-medium text-indigo-700 hover:underline">
          {r.fullName}
        </Link>
      ),
    },
    { header: "Aulas", cell: (r) => r.summary.total },
    { header: "Presenças", cell: (r) => r.summary.attended },
    { header: "Faltas", cell: (r) => r.summary.absent + r.summary.justified },
    {
      header: "Frequência",
      cell: (r) => (r.summary.percent != null ? formatPercent(r.summary.percent) : "—"),
    },
    {
      header: "Alertas",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.summary.lowFrequency && (
            <Badge className="bg-rose-100 text-rose-800">&lt; 75%</Badge>
          )}
          {r.summary.hasConsecutiveAbsenceAlert && (
            <Badge className="bg-amber-100 text-amber-800">
              {r.summary.maxConsecutiveAbsences} faltas seguidas
            </Badge>
          )}
          {!r.summary.lowFrequency && !r.summary.hasConsecutiveAbsenceAlert && (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Link
        href={`/dashboard/chamada/${classId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para a turma
      </Link>

      <PageHeader
        title={`Frequência — ${turma.name}`}
        description={`${turma.courseName} · alerta para frequência abaixo de ${formatPercent(LOW_FREQUENCY_THRESHOLD)}`}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Frequência da turma"
          value={turmaPercent != null ? formatPercent(turmaPercent) : "—"}
          icon={Percent}
          tone="emerald"
        />
        <StatCard label="Alunos" value={report.length} icon={Users} tone="indigo" />
        <StatCard
          label="Alunos abaixo de 75%"
          value={lowCount}
          icon={AlertTriangle}
          tone={lowCount > 0 ? "rose" : "slate"}
        />
      </div>

      <DataTable
        columns={columns}
        data={report}
        getRowKey={(r) => r.studentId}
        emptyIcon={Users}
        emptyTitle="Sem dados de frequência"
        emptyDescription="Faça chamadas para gerar o relatório de frequência."
      />
    </>
  );
}
