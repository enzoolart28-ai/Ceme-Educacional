"use client";

import { useState } from "react";
import { updateCandidateAction } from "@/app/actions/aula-teste";
import { useAutosave, WizardCard, StepNav } from "./wizard-kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AtCandidate } from "@/types/models";

const ta = "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function CandidateStep({ reportId, candidate }: { reportId: string; candidate: AtCandidate }) {
  const [v, setV] = useState({
    full_name: candidate.full_name ?? "",
    cpf: candidate.cpf ?? "",
    birth_date: candidate.birth_date ?? "",
    phone: candidate.phone ?? "",
    email: candidate.email ?? "",
    address: candidate.address ?? "",
    academic_background: candidate.academic_background ?? "",
    postgrad: candidate.postgrad ?? "",
    complementary_courses: candidate.complementary_courses ?? "",
    professional_experience: candidate.professional_experience ?? "",
    teaching_experience: candidate.teaching_experience ?? "",
    disciplines: candidate.disciplines ?? "",
    availability: candidate.availability ?? "",
    observations: candidate.observations ?? "",
  });
  const { status, flush } = useAutosave(v, (val) => updateCandidateAction(candidate.id, val));
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  return (
    <WizardCard title="Dados do candidato" step={1} status={status}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="full_name">Nome completo *</Label>
          <Input id="full_name" value={v.full_name} onChange={set("full_name")} />
        </div>
        <div><Label htmlFor="cpf">CPF</Label><Input id="cpf" value={v.cpf} onChange={set("cpf")} /></div>
        <div><Label htmlFor="birth_date">Data de nascimento</Label><Input id="birth_date" type="date" value={v.birth_date} onChange={set("birth_date")} /></div>
        <div><Label htmlFor="phone">Telefone</Label><Input id="phone" value={v.phone} onChange={set("phone")} /></div>
        <div><Label htmlFor="email">E-mail</Label><Input id="email" value={v.email} onChange={set("email")} /></div>
        <div className="sm:col-span-2"><Label htmlFor="address">Endereço</Label><Input id="address" value={v.address} onChange={set("address")} /></div>
        <div><Label htmlFor="academic_background">Formação acadêmica</Label><Input id="academic_background" value={v.academic_background} onChange={set("academic_background")} /></div>
        <div><Label htmlFor="postgrad">Pós-graduações</Label><Input id="postgrad" value={v.postgrad} onChange={set("postgrad")} /></div>
        <div><Label htmlFor="complementary_courses">Cursos complementares</Label><Input id="complementary_courses" value={v.complementary_courses} onChange={set("complementary_courses")} /></div>
        <div><Label htmlFor="disciplines">Disciplinas que pode ministrar</Label><Input id="disciplines" value={v.disciplines} onChange={set("disciplines")} /></div>
        <div><Label htmlFor="professional_experience">Tempo de experiência profissional</Label><Input id="professional_experience" value={v.professional_experience} onChange={set("professional_experience")} /></div>
        <div><Label htmlFor="teaching_experience">Tempo de experiência docente</Label><Input id="teaching_experience" value={v.teaching_experience} onChange={set("teaching_experience")} /></div>
        <div className="sm:col-span-2"><Label htmlFor="availability">Disponibilidade de horário</Label><Input id="availability" value={v.availability} onChange={set("availability")} /></div>
        <div className="sm:col-span-2">
          <Label htmlFor="observations">Observações gerais</Label>
          <textarea id="observations" rows={3} className={ta} value={v.observations} onChange={set("observations")} />
        </div>
      </div>
      <StepNav reportId={reportId} step={1} flush={flush} />
    </WizardCard>
  );
}
