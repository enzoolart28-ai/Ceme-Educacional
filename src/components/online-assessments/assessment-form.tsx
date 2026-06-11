"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  onlineAssessmentSchema,
  type OnlineAssessmentInput,
} from "@/lib/online-assessments/schemas";
import {
  createAssessmentAction,
  updateAssessmentAction,
} from "@/app/actions/online-assessments";
import {
  CORRECTION_TYPE_OPTIONS,
  ASSESSMENT_STATUS_OPTIONS,
} from "@/lib/online-assessments/labels";
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

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function AssessmentForm({
  mode,
  assessmentId,
  defaultValues,
  classes,
  subjects,
  teachers,
}: {
  mode: "create" | "edit";
  assessmentId?: string;
  defaultValues: OnlineAssessmentInput;
  classes: Option[];
  subjects: Option[];
  teachers: Option[];
}) {
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnlineAssessmentInput>({
    resolver: zodResolver(onlineAssessmentSchema),
    defaultValues,
  });

  function onSubmit(values: OnlineAssessmentInput) {
    setMsg(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAssessmentAction(values)
          : await updateAssessmentAction(assessmentId!, values);
      if (result?.error) setMsg({ tone: "error", text: result.error });
      else if (mode === "edit") setMsg({ tone: "success", text: "Prova salva." });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="space-y-4">
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

          <div>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" hasError={!!errors.title} {...register("title")} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <textarea id="description" rows={3} className={textareaClass} {...register("description")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <Label htmlFor="teacher_id">Professor</Label>
              <Select id="teacher_id" {...register("teacher_id")}>
                <option value="">—</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="start_date">Data de início</Label>
              <Input id="start_date" type="datetime-local" {...register("start_date")} />
            </div>
            <div>
              <Label htmlFor="end_date">Data final</Label>
              <Input id="end_date" type="datetime-local" {...register("end_date")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="time_limit_minutes">Tempo limite (min)</Label>
              <Input id="time_limit_minutes" inputMode="numeric" placeholder="—" {...register("time_limit_minutes")} />
              {errors.time_limit_minutes && (
                <p className="mt-1 text-xs text-red-600">{errors.time_limit_minutes.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="max_attempts">Tentativas</Label>
              <Input id="max_attempts" inputMode="numeric" placeholder="1" {...register("max_attempts")} />
              {errors.max_attempts && (
                <p className="mt-1 text-xs text-red-600">{errors.max_attempts.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="max_grade">Nota máxima</Label>
              <Input id="max_grade" inputMode="decimal" placeholder="10" {...register("max_grade")} />
            </div>
            <div>
              <Label htmlFor="min_grade">Nota mínima</Label>
              <Input id="min_grade" inputMode="decimal" placeholder="6" {...register("min_grade")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="correction_type">Correção *</Label>
              <Select id="correction_type" {...register("correction_type")}>
                {CORRECTION_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select id="status" {...register("status")}>
                {ASSESSMENT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("show_answer_key")} /> Mostrar gabarito ao aluno após corrigir
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("shuffle_questions")} /> Embaralhar questões
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("shuffle_options")} /> Embaralhar alternativas
            </label>
          </div>

          <Button type="submit" isLoading={isPending}>
            {mode === "create" ? "Criar prova" : "Salvar prova"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
