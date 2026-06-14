"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadInput } from "@/lib/crm/schemas";
import { createLeadAction, updateLeadAction } from "@/app/actions/crm";
import { SOURCE_OPTIONS, STATUS_OPTIONS } from "@/lib/crm/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function LeadForm({
  mode,
  leadId,
  defaultValues,
}: {
  mode: "create" | "edit";
  leadId?: string;
  defaultValues: LeadInput;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadInput>({ resolver: zodResolver(leadSchema), defaultValues });

  function onSubmit(values: LeadInput) {
    setMsg(null);
    startTransition(async () => {
      const result =
        mode === "create" ? await createLeadAction(values) : await updateLeadAction(leadId!, values);
      if (result?.error) setMsg(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="space-y-4">
          {msg && <Alert tone="error">{msg}</Alert>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="full_name">Nome *</Label>
              <Input id="full_name" hasError={!!errors.full_name} {...register("full_name")} />
              {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="age">Idade</Label>
              <Input id="age" inputMode="numeric" {...register("age")} />
              {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age.message}</p>}
            </div>
            <div>
              <Label htmlFor="guardian_name">Nome do responsável</Label>
              <Input id="guardian_name" {...register("guardian_name")} />
            </div>
            <div>
              <Label htmlFor="course_interest">Curso de interesse</Label>
              <Input id="course_interest" {...register("course_interest")} />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div>
              <Label htmlFor="source">Origem *</Label>
              <Select id="source" {...register("source")}>
                {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select id="status" {...register("status")}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observação</Label>
            <textarea id="notes" rows={3} className={textareaClass} {...register("notes")} />
          </div>

          <Button type="submit" isLoading={isPending}>
            {mode === "create" ? "Cadastrar lead" : "Salvar lead"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
