"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teacherSchema, type TeacherInput } from "@/lib/teachers/schemas";
import { createTeacherAction, updateTeacherAction } from "@/app/actions/teachers";
import { TEACHER_STATUS_OPTIONS } from "@/lib/teachers/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FieldName = keyof TeacherInput;

export function TeacherForm({
  mode,
  teacherId,
  defaultValues,
}: {
  mode: "create" | "edit";
  teacherId?: string;
  defaultValues: TeacherInput;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherInput>({
    resolver: zodResolver(teacherSchema),
    defaultValues,
  });

  function onSubmit(values: TeacherInput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTeacherAction(values)
          : await updateTeacherAction(teacherId!, values);
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
          <CardTitle>Dados do professor</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("full_name", "Nome completo *")}</div>
          {field("cpf", "CPF", { placeholder: "000.000.000-00", inputMode: "numeric" })}
          {field("rg", "RG")}
          {field("phone", "Telefone", { placeholder: "(00) 00000-0000" })}
          {field("email", "E-mail", { type: "email" })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formação e atuação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("education", "Formação", { placeholder: "Ex.: Licenciatura em Matemática" })}
          {field("expertise_area", "Área de atuação", { placeholder: "Ex.: Exatas" })}
          {field("workload", "Carga horária (h/semana)", { type: "number", inputMode: "numeric" })}
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select id="status" {...register("status")}>
              {TEACHER_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
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
        {mode === "create" ? "Cadastrar professor" : "Salvar alterações"}
      </Button>
    </form>
  );
}
