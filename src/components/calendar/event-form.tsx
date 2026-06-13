"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInput } from "@/lib/calendar/schemas";
import { createEventAction, updateEventAction } from "@/app/actions/calendar";
import { EVENT_TYPE_OPTIONS, VISIBILITY_OPTIONS } from "@/lib/calendar/labels";
import { localInputToIso } from "@/lib/calendar/dates";
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

/** defaultValues usam datetime-local (YYYY-MM-DDTHH:mm); convertidos no submit. */
export function EventForm({
  mode,
  eventId,
  defaultValues,
  classes,
  courses,
  units,
  teachers,
}: {
  mode: "create" | "edit";
  eventId?: string;
  defaultValues: EventInput;
  classes: Option[];
  courses: Option[];
  units: Option[];
  teachers: Option[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventInput>({ resolver: zodResolver(eventSchema), defaultValues });

  function onSubmit(values: EventInput) {
    setMsg(null);
    const payload: EventInput = {
      ...values,
      start_datetime: localInputToIso(values.start_datetime),
      end_datetime: values.end_datetime ? localInputToIso(values.end_datetime) : "",
    };
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createEventAction(payload)
          : await updateEventAction(eventId!, payload);
      if (result?.error) setMsg(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="space-y-4">
          {msg && <Alert tone="error">{msg}</Alert>}

          <div>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" hasError={!!errors.title} {...register("title")} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <textarea id="description" rows={3} className={textareaClass} {...register("description")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select id="type" {...register("type")}>
                {EVENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="visibility">Visibilidade *</Label>
              <Select id="visibility" {...register("visibility")}>
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="start_datetime">Início *</Label>
              <Input id="start_datetime" type="datetime-local" hasError={!!errors.start_datetime} {...register("start_datetime")} />
              {errors.start_datetime && <p className="mt-1 text-xs text-red-600">{errors.start_datetime.message}</p>}
            </div>
            <div>
              <Label htmlFor="end_datetime">Término</Label>
              <Input id="end_datetime" type="datetime-local" {...register("end_datetime")} />
              {errors.end_datetime && <p className="mt-1 text-xs text-red-600">{errors.end_datetime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="course_id">Curso</Label>
              <Select id="course_id" {...register("course_id")}>
                <option value="">—</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="class_id">Turma</Label>
              <Select id="class_id" {...register("class_id")}>
                <option value="">—</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="unit_id">Unidade</Label>
              <Select id="unit_id" {...register("unit_id")}>
                <option value="">—</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="teacher_id">Professor</Label>
              <Select id="teacher_id" {...register("teacher_id")}>
                <option value="">—</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Local</Label>
            <Input id="location" placeholder="Ex.: Sala 1, Auditório…" {...register("location")} />
          </div>

          <Button type="submit" isLoading={isPending}>
            {mode === "create" ? "Criar evento" : "Salvar evento"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
