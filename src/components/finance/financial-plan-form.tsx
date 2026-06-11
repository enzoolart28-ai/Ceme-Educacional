"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  financialPlanSchema,
  type FinancialPlanInput,
} from "@/lib/finance/schemas";
import {
  createFinancialPlanAction,
  updateFinancialPlanAction,
} from "@/app/actions/finance";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type FieldName = keyof FinancialPlanInput;

export function FinancialPlanForm({
  mode,
  planId,
  courses,
  defaultValues,
}: {
  mode: "create" | "edit";
  planId?: string;
  courses: { id: string; name: string }[];
  defaultValues: FinancialPlanInput;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FinancialPlanInput>({
    resolver: zodResolver(financialPlanSchema),
    defaultValues,
  });

  function onSubmit(values: FinancialPlanInput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createFinancialPlanAction(values)
          : await updateFinancialPlanAction(planId!, values);
      if (result?.error) setServerError(result.error);
    });
  }

  function field(
    name: FieldName,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) {
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
          <CardTitle>Dados do plano</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("name", "Nome do plano *")}</div>
          <div className="sm:col-span-2">
            <Label htmlFor="course_id">Curso</Label>
            <Select id="course_id" {...register("course_id")}>
              <option value="">Todos os cursos</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Select>
          </div>
          {field("total_value", "Valor total *", { inputMode: "decimal", placeholder: "0,00" })}
          {field("installments", "Parcelas *", { type: "number", min: 1 })}
          {field("due_day", "Dia de vencimento *", { type: "number", min: 1, max: 28 })}
          {field("discount_value", "Desconto total", { inputMode: "decimal", placeholder: "0,00" })}
          {field("scholarship_percentage", "Bolsa (%)", {
            inputMode: "decimal",
            placeholder: "0",
          })}
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              rows={4}
              className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              {...register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" isLoading={isPending}>
        {mode === "create" ? "Criar plano" : "Salvar plano"}
      </Button>
    </form>
  );
}

