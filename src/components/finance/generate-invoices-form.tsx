"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  generateInvoicesSchema,
  type GenerateInvoicesInput,
} from "@/lib/finance/schemas";
import { generateInvoicesAction } from "@/app/actions/finance";
import type { FinanceEnrollmentOption, FinancialPlanRow } from "@/lib/finance/queries";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function GenerateInvoicesForm({
  plans,
  enrollments,
}: {
  plans: FinancialPlanRow[];
  enrollments: FinanceEnrollmentOption[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const month = new Date().toISOString().slice(0, 7);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateInvoicesInput>({
    resolver: zodResolver(generateInvoicesSchema),
    defaultValues: { plan_id: "", enrollment_id: "", first_due_month: month, notes: "" },
  });

  function onSubmit(values: GenerateInvoicesInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await generateInvoicesAction(values);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Gerar mensalidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <div>
            <Label htmlFor="plan_id">Plano financeiro *</Label>
            <Select id="plan_id" hasError={!!errors.plan_id} {...register("plan_id")}>
              <option value="">Selecione</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </Select>
            {errors.plan_id && (
              <p className="mt-1 text-xs text-red-600">{errors.plan_id.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="enrollment_id">Matrícula *</Label>
            <Select
              id="enrollment_id"
              hasError={!!errors.enrollment_id}
              {...register("enrollment_id")}
            >
              <option value="">Selecione</option>
              {enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollment.studentName} - {enrollment.courseName} / {enrollment.className}
                </option>
              ))}
            </Select>
            {errors.enrollment_id && (
              <p className="mt-1 text-xs text-red-600">{errors.enrollment_id.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="first_due_month">Mês inicial *</Label>
            <Input
              id="first_due_month"
              type="month"
              hasError={!!errors.first_due_month}
              {...register("first_due_month")}
            />
            {errors.first_due_month && (
              <p className="mt-1 text-xs text-red-600">{errors.first_due_month.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              rows={3}
              className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              {...register("notes")}
            />
          </div>
          <Button type="submit" isLoading={isPending}>
            Gerar cobranças
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

