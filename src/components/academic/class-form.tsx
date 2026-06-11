"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { classSchema, type ClassInput } from "@/lib/academic/schemas";
import { createClassAction } from "@/app/actions/academic";
import { SHIFT_OPTIONS } from "@/lib/academic/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export function ClassForm({
  courses,
}: {
  courses: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      course_id: "",
      year: new Date().getFullYear(),
      shift: "manha",
    },
  });

  function onSubmit(values: ClassInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createClassAction(values);
      if (result.error) {
        setServerError(result.error);
      } else {
        reset();
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} disabled={courses.length === 0}>
        <Plus className="h-4 w-4" /> Nova turma
      </Button>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Nova turma</h3>
          <button onClick={() => setOpen(false)} aria-label="Fechar">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nome da turma</Label>
              <Input id="name" placeholder="Ex.: 2º Ano A" hasError={!!errors.name} {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="course_id">Curso</Label>
              <Select id="course_id" hasError={!!errors.course_id} {...register("course_id")}>
                <option value="">Selecione…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {errors.course_id && (
                <p className="mt-1 text-xs text-red-600">{errors.course_id.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="year">Ano letivo</Label>
              <Input
                id="year"
                type="number"
                hasError={!!errors.year}
                {...register("year", { valueAsNumber: true })}
              />
              {errors.year && (
                <p className="mt-1 text-xs text-red-600">{errors.year.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="shift">Turno</Label>
              <Select id="shift" {...register("shift")}>
                {SHIFT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" isLoading={isPending}>
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
