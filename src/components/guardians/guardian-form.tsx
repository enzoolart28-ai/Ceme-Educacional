"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guardianSchema, type GuardianInput } from "@/lib/guardians/schemas";
import { createGuardianAction, updateGuardianAction } from "@/app/actions/guardians";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FieldName = keyof GuardianInput;

export function GuardianForm({
  mode,
  guardianId,
  defaultValues,
}: {
  mode: "create" | "edit";
  guardianId?: string;
  defaultValues: GuardianInput;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuardianInput>({
    resolver: zodResolver(guardianSchema),
    defaultValues,
  });

  function onSubmit(values: GuardianInput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createGuardianAction(values)
          : await updateGuardianAction(guardianId!, values);
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
          <CardTitle>Dados do responsável</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("full_name", "Nome completo *")}</div>
          {field("cpf", "CPF", { placeholder: "000.000.000-00", inputMode: "numeric" })}
          {field("rg", "RG")}
          {field("phone", "Telefone", { placeholder: "(00) 00000-0000" })}
          {field("email", "E-mail", { type: "email" })}
          {field("kinship", "Grau de parentesco", { placeholder: "Mãe, Pai, Avó…" })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">{field("address", "Endereço")}</div>
          <div className="sm:col-span-1">{field("city", "Cidade")}</div>
          <div className="sm:col-span-1">{field("state", "UF", { maxLength: 2, placeholder: "MG" })}</div>
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
        {mode === "create" ? "Cadastrar responsável" : "Salvar alterações"}
      </Button>
    </form>
  );
}
