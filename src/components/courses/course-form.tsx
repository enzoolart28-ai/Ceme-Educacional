"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, type CourseInput } from "@/lib/courses/schemas";
import { createCourseAction, updateCourseAction } from "@/app/actions/courses";
import {
  MODALITY_OPTIONS,
  TYPE_OPTIONS,
  COURSE_STATUS_OPTIONS,
} from "@/lib/courses/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FieldName = keyof CourseInput;

export function CourseForm({
  mode,
  courseId,
  defaultValues,
}: {
  mode: "create" | "edit";
  courseId?: string;
  defaultValues: CourseInput;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues,
  });

  function onSubmit(values: CourseInput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCourseAction(values)
          : await updateCourseAction(courseId!, values);
      if (result?.error) setServerError(result.error);
    });
  }

  function field(name: FieldName, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) {
    return (
      <div>
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} hasError={!!errors[name]} {...props} {...register(name)} />
        {errors[name] && (
          <p className="mt-1 text-xs text-red-600">{errors[name]?.message as string}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("name", "Nome *")}</div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register("description")} />
          </div>
          <div>
            <Label htmlFor="modality">Modalidade *</Label>
            <Select id="modality" {...register("modality")}>
              {MODALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="type">Tipo *</Label>
            <Select id="type" {...register("type")}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select id="status" {...register("status")}>
              {COURSE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carga horária e valor</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {field("workload_hours", "Carga horária (h)", { type: "number", inputMode: "numeric" })}
          {field("duration", "Duração", { placeholder: "Ex.: 6 meses" })}
          {field("price", "Valor (R$)", { inputMode: "decimal", placeholder: "0.00" })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificação e conclusão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              {...register("certificate_enabled")}
            />
            Emite certificado
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field("minimum_attendance", "Frequência mínima (%)", { type: "number", inputMode: "numeric" })}
            {field("minimum_grade", "Média mínima (0–10)", { inputMode: "decimal", placeholder: "6.00" })}
          </div>
          <div>
            <Label htmlFor="requirements">Requisitos para conclusão</Label>
            <textarea
              id="requirements"
              rows={3}
              className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              {...register("requirements")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            id="notes"
            rows={3}
            className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            {...register("notes")}
          />
        </CardContent>
      </Card>

      <Button type="submit" isLoading={isPending}>
        {mode === "create" ? "Cadastrar curso" : "Salvar alterações"}
      </Button>
    </form>
  );
}
