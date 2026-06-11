"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classSchema, type ClassInput } from "@/lib/classes/schemas";
import { createClassAction, updateClassAction } from "@/app/actions/classes";
import { SHIFT_OPTIONS } from "@/lib/academic/labels";
import { CLASS_STATUS_OPTIONS, WEEKDAYS } from "@/lib/classes/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Option {
  id: string;
  name: string;
}

export function ClassForm({
  mode,
  classId,
  defaultValues,
  courses,
  units,
  teachers,
}: {
  mode: "create" | "edit";
  classId?: string;
  defaultValues: ClassInput;
  courses: Option[];
  units: Option[];
  teachers: Option[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
    defaultValues,
  });

  function onSubmit(values: ClassInput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createClassAction(values)
          : await updateClassAction(classId!, values);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Nome da turma *</Label>
            <Input id="name" placeholder="Ex.: 2º Ano A" hasError={!!errors.name} {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="course_id">Curso *</Label>
            <Select id="course_id" hasError={!!errors.course_id} {...register("course_id")}>
              <option value="">Selecione…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            {errors.course_id && <p className="mt-1 text-xs text-red-600">{errors.course_id.message}</p>}
          </div>
          <div>
            <Label htmlFor="unit_id">Unidade/polo</Label>
            <Select id="unit_id" {...register("unit_id")}>
              <option value="">—</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="main_teacher_id">Professor responsável</Label>
            <Select id="main_teacher_id" {...register("main_teacher_id")}>
              <option value="">—</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="shift">Turno *</Label>
            <Select id="shift" {...register("shift")}>
              {SHIFT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select id="status" {...register("status")}>
              {CLASS_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Período e horário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="year">Ano letivo</Label>
              <Input id="year" type="number" placeholder="2026" {...register("year")} />
              {errors.year && <p className="mt-1 text-xs text-red-600">{errors.year.message}</p>}
            </div>
            <div>
              <Label htmlFor="start_date">Início</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
            </div>
            <div>
              <Label htmlFor="end_date">Término</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
            </div>
            <div>
              <Label htmlFor="max_students">Máx. de alunos</Label>
              <Input id="max_students" type="number" {...register("max_students")} />
              {errors.max_students && (
                <p className="mt-1 text-xs text-red-600">{errors.max_students.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="start_time">Horário inicial</Label>
              <Input id="start_time" type="time" {...register("start_time")} />
            </div>
            <div>
              <Label htmlFor="end_time">Horário final</Label>
              <Input id="end_time" type="time" {...register("end_time")} />
            </div>
          </div>
          <div>
            <Label>Dias da semana</Label>
            <div className="mt-1 flex flex-wrap gap-3">
              {WEEKDAYS.map((d) => (
                <label key={d.value} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    value={d.value}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    {...register("weekdays")}
                  />
                  {d.short}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" isLoading={isPending}>
        {mode === "create" ? "Criar turma" : "Salvar alterações"}
      </Button>
    </form>
  );
}
