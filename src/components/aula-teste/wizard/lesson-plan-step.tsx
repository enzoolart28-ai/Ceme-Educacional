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

const SHORT_FIELDS = [
  { key: "tema", label: "Tema" },
  { key: "disciplina", label: "Disciplina" },
  { key: "turma", label: "Turma" },
  { key: "duracao", label: "Duração" },
] as const;

const LONG_FIELDS = [
  { key: "objetivo_geral", label: "Objetivo geral", rows: 2 },
  { key: "objetivos_especificos", label: "Objetivos específicos", rows: 3 },
  { key: "habilidades", label: "Habilidades e competências", rows: 2 },
  { key: "conteudos", label: "Conteúdos", rows: 2 },
  { key: "metodologia", label: "Metodologia", rows: 3 },
  { key: "recursos", label: "Recursos didáticos", rows: 2 },
  { key: "etapas", label: "Etapas da aula", rows: 3 },
  { key: "atividade", label: "Atividade proposta", rows: 2 },
  { key: "participacao", label: "Forma de participação dos alunos", rows: 2 },
  { key: "avaliacao", label: "Avaliação da aprendizagem", rows: 2 },
  { key: "adaptacao", label: "Adaptação para alunos com dificuldades", rows: 2 },
  { key: "referencias", label: "Referências", rows: 2 },
  { key: "observacoes", label: "Observações", rows: 2 },
] as const;

const ALL_KEYS = [...SHORT_FIELDS, ...LONG_FIELDS].map((f) => f.key);

export function LessonPlanStep({
  reportId,
  report,
  attachments,
}: {
  reportId: string;
  report: AtReport;
  attachments: AttachmentWithUrl[];
}) {
  const source = (report.lesson_plan ?? {}) as Record<string, string>;
  const [plan, setPlan] = useState<Record<string, string>>(
    Object.fromEntries(ALL_KEYS.map((k) => [k, source[k] ?? ""])),
  );
  const { status, flush } = useAutosave(plan, (val) => updateReportAction(reportId, { lesson_plan: val }));
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPlan((p) => ({ ...p, [k]: e.target.value }));

  return (
    <WizardCard title="Plano de aula" step={4} status={status}>
      <div>
        <Label>Plano de aula anexado (opcional)</Label>
        <AttachmentsManager reportId={reportId} kind="plano_aula" label="plano de aula" attachments={attachments} />
      </div>

      <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Plano preenchido no sistema</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SHORT_FIELDS.map((f) => (
          <div key={f.key}>
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input id={f.key} value={plan[f.key]} onChange={set(f.key)} />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {LONG_FIELDS.map((f) => (
          <div key={f.key}>
            <Label htmlFor={f.key}>{f.label}</Label>
            <textarea id={f.key} rows={f.rows} className={ta} value={plan[f.key]} onChange={set(f.key)} />
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">A avaliação do plano por critérios (notas) é preenchida na etapa de avaliações.</p>
      <StepNav reportId={reportId} step={4} flush={flush} />
    </WizardCard>
  );
}
