"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reportCreateSchema, type ReportCreateInput } from "@/lib/aula-teste/schemas";
import { createReportAction } from "@/app/actions/aula-teste";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export function ReportCreateForm({ units }: { units: { id: string; name: string }[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<ReportCreateInput>({
    resolver: zodResolver(reportCreateSchema),
    defaultValues: { full_name: "", cpf: "", email: "", phone: "", position_title: "", discipline: "", unit_id: "", modality: "", test_date: "" },
  });

  function onSubmit(values: ReportCreateInput) {
    setMsg(null);
    startTransition(async () => {
      const r = await createReportAction(values);
      if (r?.error) setMsg(r.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="space-y-4">
          {msg && <Alert tone="error">{msg}</Alert>}

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Candidato</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input id="full_name" hasError={!!errors.full_name} {...register("full_name")} />
              {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...register("cpf")} />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" hasError={!!errors.email} {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Vaga / Aula-teste</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="position_title">Vaga pretendida</Label>
              <Input id="position_title" {...register("position_title")} placeholder="Ex.: Professor de Matemática" />
            </div>
            <div>
              <Label htmlFor="discipline">Disciplina</Label>
              <Input id="discipline" {...register("discipline")} />
            </div>
            <div>
              <Label htmlFor="unit_id">Unidade / polo</Label>
              <Select id="unit_id" {...register("unit_id")}>
                <option value="">—</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="modality">Modalidade de ensino</Label>
              <Input id="modality" {...register("modality")} placeholder="Ex.: Presencial" />
            </div>
            <div>
              <Label htmlFor="test_date">Data da aula-teste</Label>
              <Input id="test_date" type="date" {...register("test_date")} />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Os demais dados (currículo, plano de aula, avaliações) são preenchidos nas próximas etapas do relatório.
          </p>
          <Button type="submit" isLoading={isPending}>Criar relatório</Button>
        </CardContent>
      </Card>
    </form>
  );
}
