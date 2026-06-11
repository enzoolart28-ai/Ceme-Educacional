"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subjectSchema, type SubjectInput } from "@/lib/subjects/schemas";
import { createSubjectAction, updateSubjectAction } from "@/app/actions/subjects";
import { SUBJECT_STATUS_OPTIONS } from "@/lib/subjects/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export function SubjectForm({
  mode,
  subjectId,
  defaultValues,
}: {
  mode: "create" | "edit";
  subjectId?: string;
  defaultValues: SubjectInput;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues,
  });

  function onSubmit(values: SubjectInput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createSubjectAction(values)
          : await updateSubjectAction(subjectId!, values);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="space-y-4">
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" hasError={!!errors.name} {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="code">Código</Label>
              <Input id="code" placeholder="Ex.: MAT" {...register("code")} />
            </div>
            <div>
              <Label htmlFor="workload_hours">Carga horária (h)</Label>
              <Input id="workload_hours" type="number" {...register("workload_hours")} />
              {errors.workload_hours && (
                <p className="mt-1 text-xs text-red-600">{errors.workload_hours.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select id="status" {...register("status")}>
                {SUBJECT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" {...register("description")} />
            </div>
          </div>
          <Button type="submit" isLoading={isPending}>
            {mode === "create" ? "Cadastrar disciplina" : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
