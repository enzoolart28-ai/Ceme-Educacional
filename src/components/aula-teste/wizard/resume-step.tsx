"use client";

import { useState } from "react";
import { updateReportAction } from "@/app/actions/aula-teste";
import { useAutosave, WizardCard, StepNav } from "./wizard-kit";
import { AttachmentsManager } from "./attachments-manager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AtReport } from "@/types/models";
import type { AttachmentWithUrl } from "@/lib/aula-teste/queries";

const ta = "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function ResumeStep({
  reportId,
  report,
  attachments,
}: {
  reportId: string;
  report: AtReport;
  attachments: AttachmentWithUrl[];
}) {
  const [v, setV] = useState({
    resume_summary: report.resume_summary ?? "",
    resume_notes: report.resume_notes ?? "",
    resume_sent_at: report.resume_sent_at ?? "",
  });
  const { status, flush } = useAutosave(v, (val) => updateReportAction(reportId, val));
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  return (
    <WizardCard title="Currículo" step={2} status={status}>
      <div>
        <Label>Arquivo do currículo</Label>
        <AttachmentsManager reportId={reportId} kind="curriculo" label="currículo" attachments={attachments} />
      </div>
      <div className="max-w-xs">
        <Label htmlFor="resume_sent_at">Data do envio</Label>
        <Input id="resume_sent_at" type="date" value={v.resume_sent_at} onChange={set("resume_sent_at")} />
      </div>
      <div>
        <Label htmlFor="resume_summary">Resumo curricular</Label>
        <textarea id="resume_summary" rows={4} className={ta} value={v.resume_summary} onChange={set("resume_summary")} placeholder="Síntese da formação e experiência do candidato." />
      </div>
      <div>
        <Label htmlFor="resume_notes">Observações sobre formação e experiência</Label>
        <textarea id="resume_notes" rows={3} className={ta} value={v.resume_notes} onChange={set("resume_notes")} />
      </div>
      <p className="text-xs text-slate-500">A análise curricular por critérios (notas) é preenchida na etapa de avaliações.</p>
      <StepNav reportId={reportId} step={2} flush={flush} />
    </WizardCard>
  );
}
