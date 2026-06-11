"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lessonSchema, type LessonInput } from "@/lib/ava/schemas";
import { createLessonAction, updateLessonAction } from "@/app/actions/ava";
import { RELEASE_TYPE_OPTIONS, LESSON_STATUS_OPTIONS } from "@/lib/ava/labels";
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

export function LessonForm({
  mode,
  lessonId,
  defaultValues,
  modules,
  subjects,
}: {
  mode: "create" | "edit";
  lessonId?: string;
  defaultValues: LessonInput;
  modules: Option[];
  subjects: Option[];
}) {
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LessonInput>({ resolver: zodResolver(lessonSchema), defaultValues });

  const releaseType = watch("release_type");

  function onSubmit(values: LessonInput) {
    setMsg(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createLessonAction(values)
          : await updateLessonAction(lessonId!, values);
      if (result?.error) setMsg({ tone: "error", text: result.error });
      else if (mode === "edit") setMsg({ tone: "success", text: "Aula salva." });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <input type="hidden" {...register("course_id")} />
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
            <textarea
              id="description"
              rows={3}
              className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              {...register("description")}
            />
          </div>
          <div>
            <Label htmlFor="video_url">URL do vídeo (embed)</Label>
            <Input id="video_url" placeholder="https://www.youtube.com/embed/…" {...register("video_url")} />
            {errors.video_url && <p className="mt-1 text-xs text-red-600">{errors.video_url.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="module_id">Módulo</Label>
              <Select id="module_id" {...register("module_id")}>
                <option value="">—</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
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
              <Label htmlFor="release_type">Liberação *</Label>
              <Select id="release_type" {...register("release_type")}>
                {RELEASE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            {releaseType === "date" && (
              <div>
                <Label htmlFor="release_date">Liberar em</Label>
                <Input id="release_date" type="date" {...register("release_date")} />
              </div>
            )}
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select id="status" {...register("status")}>
                {LESSON_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
          </div>
          <Button type="submit" isLoading={isPending}>
            {mode === "create" ? "Criar aula" : "Salvar aula"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
