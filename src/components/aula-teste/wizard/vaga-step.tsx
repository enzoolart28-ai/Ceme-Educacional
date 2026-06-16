"use client";

import { useState } from "react";
import { updateReportAction } from "@/app/actions/aula-teste";
import { useAutosave, WizardCard, StepNav } from "./wizard-kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AtReport } from "@/types/models";

export function VagaStep({
  reportId,
  report,
  units,
}: {
  reportId: string;
  report: AtReport;
  units: { id: string; name: string }[];
}) {
  const [v, setV] = useState({
    position_title: report.position_title ?? "",
    discipline: report.discipline ?? "",
    unit_id: report.unit_id ?? "",
    modality: report.modality ?? "",
  });
  const { status, flush } = useAutosave(v, (val) => updateReportAction(reportId, val));
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  return (
    <WizardCard title="Informações da vaga" step={3} status={status}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="position_title">Vaga pretendida</Label>
          <Input id="position_title" value={v.position_title} onChange={set("position_title")} placeholder="Ex.: Professor de Matemática" />
        </div>
        <div>
          <Label htmlFor="discipline">Componente curricular / disciplina</Label>
          <Input id="discipline" value={v.discipline} onChange={set("discipline")} />
        </div>
        <div>
          <Label htmlFor="unit_id">Unidade / polo</Label>
          <Select id="unit_id" value={v.unit_id} onChange={set("unit_id")}>
            <option value="">—</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="modality">Modalidade de ensino</Label>
          <Input id="modality" value={v.modality} onChange={set("modality")} placeholder="Ex.: Presencial, EAD, Híbrido" />
        </div>
      </div>
      <StepNav reportId={reportId} step={3} flush={flush} />
    </WizardCard>
  );
}
