"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assessmentSchema, type AssessmentInput } from "@/lib/grades/schemas";
import { createAssessmentAction, updateAssessmentAction } from "@/app/actions/grades";
import { ASSESSMENT_TYPE_OPTIONS } from "@/lib/grades/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface Option {
  id: string;
  name: string;
}

export function AssessmentForm({
  mode,
  assessmentId,
  defaultValues,
  classes,
  subjects,
}: {
  mode: "create" | "edit";
  assessmentId?: string;
  defaultValues: AssessmentInput;
  classes: Option[];
  subjects: Option[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssessmentInput>({
    resolver: zodResolver(assessmentSchema),
    defaultValues,
  });

  function onSubmit(values: AssessmentInput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAssessmentAction(values)
          : await updateAssessmentAction(assessmentId!, values);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="space-y-4">
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" hasError={!!errors.name} {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select id="type" {...register("type")}>
                {ASSESSMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="class_id">Turma *</Label>
              <Select id="class_id" hasError={!!errors.class_id} {...register("class_id")}>
                <option value="">Selecione…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              {errors.class_id && <p className="mt-1 text-xs text-red-600">{errors.class_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="subject_id">Disciplina</Label>
              <Select id="subject_id" {...register("subject_id")}>
                <option value="">—</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            <div>
              <Label htmlFor="weight">Peso</Label>
              <Input id="weight" inputMode="decimal" placeholder="1" {...register("weight")} />
              {errors.weight && <p className="mt-1 text-xs text-red-600">{errors.weight.message}</p>}
            </div>
            <div>
              <Label htmlFor="max_grade">Nota máxima</Label>
              <Input id="max_grade" inputMode="decimal" placeholder="10" {...register("max_grade")} />
              {errors.max_grade && <p className="mt-1 text-xs text-red-600">{errors.max_grade.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" {...register("notes")} />
            </div>
          </div>
          <Button type="submit" isLoading={isPending}>
            {mode === "create" ? "Criar avaliação" : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
