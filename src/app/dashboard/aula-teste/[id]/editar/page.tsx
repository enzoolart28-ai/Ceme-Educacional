import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import {
  getReportDetail,
  getReportAttachmentsWithUrls,
  listUnits,
  listClassesBrief,
} from "@/lib/aula-teste/queries";
import { AT_WIZARD_STEPS, AT_WIZARD_TOTAL } from "@/lib/aula-teste/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { WizardStepper } from "@/components/aula-teste/wizard/wizard-stepper";
import { CandidateStep } from "@/components/aula-teste/wizard/candidate-step";
import { ResumeStep } from "@/components/aula-teste/wizard/resume-step";
import { VagaStep } from "@/components/aula-teste/wizard/vaga-step";
import { LessonPlanStep } from "@/components/aula-teste/wizard/lesson-plan-step";
import { AulaTesteStep } from "@/components/aula-teste/wizard/aula-teste-step";

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AulaTesteWizardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  await requirePermission("aulateste.manage");
  const stepRaw = Number(one((await searchParams).step) ?? "1");
  const step = Number.isFinite(stepRaw) && stepRaw >= 1 && stepRaw <= AT_WIZARD_TOTAL ? stepRaw : 1;

  const detail = await getReportDetail(id);
  if (!detail) notFound();
  const { report, candidate } = detail;

  const [attachments, units, classes] = await Promise.all([
    getReportAttachmentsWithUrls(id),
    listUnits(),
    listClassesBrief(),
  ]);

  const meta = AT_WIZARD_STEPS.find((s) => s.n === step);
  const pct = Math.round((step / AT_WIZARD_TOTAL) * 100);

  return (
    <>
      <Link href={`/dashboard/aula-teste/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para o relatório
      </Link>
      <PageHeader title={candidate.full_name} description={`${report.code} · preenchimento do relatório`} />

      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Progresso</span>
          <span>{step}/{AT_WIZARD_TOTAL}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card><CardContent className="p-2"><WizardStepper reportId={id} current={step} /></CardContent></Card>
        </aside>

        <div>
          {step === 1 && <CandidateStep reportId={id} candidate={candidate} />}
          {step === 2 && <ResumeStep reportId={id} report={report} attachments={attachments} />}
          {step === 3 && <VagaStep reportId={id} report={report} units={units} />}
          {step === 4 && <LessonPlanStep reportId={id} report={report} attachments={attachments} />}
          {step === 5 && <AulaTesteStep reportId={id} report={report} classes={classes} />}
          {step >= 6 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">{meta?.label}</p>
                  <p className="text-sm text-slate-500">Esta etapa será habilitada em breve (em desenvolvimento).</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/aula-teste/${id}/editar?step=${step - 1}`} className="text-sm text-indigo-600 hover:underline">← Etapa anterior</Link>
                  {step < AT_WIZARD_TOTAL && (
                    <Link href={`/dashboard/aula-teste/${id}/editar?step=${step + 1}`} className="text-sm text-indigo-600 hover:underline">Próxima etapa →</Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
