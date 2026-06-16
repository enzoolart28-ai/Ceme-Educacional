import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, User, Briefcase, CalendarClock } from "lucide-react";
import { requirePermission, getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getReportDetail } from "@/lib/aula-teste/queries";
import {
  AT_REPORT_STATUS_BADGE,
  atReportStatusLabel,
  atProcessStatusLabel,
} from "@/lib/aula-teste/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProcessStatusSelect, ReportDeleteButton } from "@/components/aula-teste/report-actions";
import type { AtReportStatus, AtProcessStatus } from "@/types/models";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800">{value || "—"}</dd>
    </div>
  );
}

export default async function AulaTesteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("aulateste.evaluate");
  const profile = await getProfile();
  const canManage = profile ? hasPermission(profile.role, "aulateste.manage") : false;

  const detail = await getReportDetail(id);
  if (!detail) notFound();
  const { report, candidate, unitName } = detail;

  return (
    <>
      <Link href="/dashboard/aula-teste" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para relatórios
      </Link>
      <PageHeader
        title={candidate.full_name}
        description={`${report.code}${report.position_title ? ` · ${report.position_title}` : ""}`}
        action={
          <div className="flex items-center gap-2">
            <Badge className={AT_REPORT_STATUS_BADGE[report.status as AtReportStatus]}>{atReportStatusLabel(report.status as AtReportStatus)}</Badge>
            {canManage && (
              <>
                <Link href={`/dashboard/aula-teste/${id}/editar`}>
                  <Button variant="outline"><Pencil className="h-4 w-4" /> Preencher / Editar</Button>
                </Link>
                <ReportDeleteButton id={id} />
              </>
            )}
          </div>
        }
      />

      {canManage && (
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Situação do processo</p>
              <p className="text-xs text-slate-500">Definida manualmente pela comissão — o sistema não decide automaticamente.</p>
            </div>
            <ProcessStatusSelect id={id} value={report.process_status as AtProcessStatus} />
          </CardContent>
        </Card>
      )}
      {!canManage && (
        <div className="mb-4">
          <Badge className="bg-sky-100 text-sky-800">{atProcessStatusLabel(report.process_status as AtProcessStatus)}</Badge>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><User className="h-4 w-4 text-indigo-500" /> Candidato</h2>
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Nome" value={candidate.full_name} />
              <Field label="CPF" value={candidate.cpf} />
              <Field label="E-mail" value={candidate.email} />
              <Field label="Telefone" value={candidate.phone} />
              <Field label="Formação" value={candidate.academic_background} />
              <Field label="Experiência docente" value={candidate.teaching_experience} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Briefcase className="h-4 w-4 text-indigo-500" /> Vaga e aula-teste</h2>
            <dl className="grid grid-cols-2 gap-3">
              <Field label="Vaga" value={report.position_title} />
              <Field label="Disciplina" value={report.discipline} />
              <Field label="Unidade" value={unitName} />
              <Field label="Modalidade" value={report.modality} />
              <Field label="Data da aula-teste" value={report.test_date ? formatDate(report.test_date) : null} />
              <Field label="Tema" value={report.theme} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarClock className="h-4 w-4" />
          Criado em {formatDate(report.created_at)}.
          {canManage && " Use “Preencher / Editar” para completar currículo, plano de aula, avaliações e parecer."}
        </CardContent>
      </Card>
    </>
  );
}
