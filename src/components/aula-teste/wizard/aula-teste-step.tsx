"use client";

import { useState } from "react";
import { updateReportAction } from "@/app/actions/aula-teste";
import { useAutosave, WizardCard, StepNav } from "./wizard-kit";
import { AT_MODALITY_OPTIONS } from "@/lib/aula-teste/labels";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AtReport } from "@/types/models";

const ta = "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function AulaTesteStep({
  reportId,
  report,
  classes,
}: {
  reportId: string;
  report: AtReport;
  classes: { id: string; name: string }[];
}) {
  const [v, setV] = useState({
    test_date: report.test_date ?? "",
    start_time: report.start_time ?? "",
    end_time: report.end_time ?? "",
    duration_minutes: report.duration_minutes != null ? String(report.duration_minutes) : "",
    class_id: report.class_id ?? "",
    age_group: report.age_group ?? "",
    students_present: report.students_present != null ? String(report.students_present) : "",
    theme: report.theme ?? "",
    content: report.content ?? "",
    test_modality: report.test_modality ?? "",
    location: report.location ?? "",
    available_resources: report.available_resources ?? "",
    used_resources: report.used_resources ?? "",
    evaluators_present: report.evaluators_present ?? "",
  });
  const { status, flush } = useAutosave(v, (val) => updateReportAction(reportId, val));
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  return (
    <WizardCard title="Aula-teste" step={5} status={status}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><Label htmlFor="test_date">Data</Label><Input id="test_date" type="date" value={v.test_date} onChange={set("test_date")} /></div>
        <div><Label htmlFor="start_time">Início</Label><Input id="start_time" type="time" value={v.start_time} onChange={set("start_time")} /></div>
        <div><Label htmlFor="end_time">Término</Label><Input id="end_time" type="time" value={v.end_time} onChange={set("end_time")} /></div>
        <div><Label htmlFor="duration_minutes">Duração (min)</Label><Input id="duration_minutes" inputMode="numeric" value={v.duration_minutes} onChange={set("duration_minutes")} /></div>
        <div>
          <Label htmlFor="class_id">Turma</Label>
          <Select id="class_id" value={v.class_id} onChange={set("class_id")}>
            <option value="">—</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div><Label htmlFor="age_group">Faixa etária dos alunos</Label><Input id="age_group" value={v.age_group} onChange={set("age_group")} /></div>
        <div><Label htmlFor="students_present">Alunos presentes</Label><Input id="students_present" inputMode="numeric" value={v.students_present} onChange={set("students_present")} /></div>
        <div>
          <Label htmlFor="test_modality">Modalidade</Label>
          <Select id="test_modality" value={v.test_modality} onChange={set("test_modality")}>
            <option value="">—</option>
            {AT_MODALITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <div><Label htmlFor="location">Sala / local</Label><Input id="location" value={v.location} onChange={set("location")} /></div>
        <div className="sm:col-span-3"><Label htmlFor="theme">Tema da aula</Label><Input id="theme" value={v.theme} onChange={set("theme")} /></div>
      </div>
      <div>
        <Label htmlFor="content">Conteúdo abordado</Label>
        <textarea id="content" rows={2} className={ta} value={v.content} onChange={set("content")} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><Label htmlFor="available_resources">Recursos disponíveis</Label><textarea id="available_resources" rows={2} className={ta} value={v.available_resources} onChange={set("available_resources")} /></div>
        <div><Label htmlFor="used_resources">Recursos utilizados pelo candidato</Label><textarea id="used_resources" rows={2} className={ta} value={v.used_resources} onChange={set("used_resources")} /></div>
      </div>
      <div>
        <Label htmlFor="evaluators_present">Avaliadores presentes</Label>
        <textarea id="evaluators_present" rows={2} className={ta} value={v.evaluators_present} onChange={set("evaluators_present")} />
      </div>
      <StepNav reportId={reportId} step={5} flush={flush} />
    </WizardCard>
  );
}
