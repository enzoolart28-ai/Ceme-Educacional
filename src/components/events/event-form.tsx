"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInput } from "@/lib/events/schemas";
import { createEventAction, updateEventAction } from "@/app/actions/events";
import { EVENT_STATUS_OPTIONS } from "@/lib/events/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function EventForm({
  mode,
  eventId,
  defaultValues,
  responsibles,
}: {
  mode: "create" | "edit";
  eventId?: string;
  defaultValues: EventInput;
  responsibles: { id: string; full_name: string }[];
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
    startTransition(async () => {
      const result =
        mode === "create" ? await createEventAction(values) : await updateEventAction(eventId!, values);
      if (result?.error) setMsg(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="space-y-4">
          {msg && <Alert tone="error">{msg}</Alert>}

          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" hasError={!!errors.name} {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <textarea id="description" rows={3} className={textareaClass} {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            <div>
              <Label htmlFor="start_time">Início</Label>
              <Input id="start_time" type="time" {...register("start_time")} />
            </div>
            <div>
              <Label htmlFor="end_time">Término</Label>
              <Input id="end_time" type="time" {...register("end_time")} />
            </div>
            <div>
              <Label htmlFor="max_registrations">Limite</Label>
              <Input id="max_registrations" inputMode="numeric" placeholder="—" {...register("max_registrations")} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="location">Local</Label>
              <Input id="location" {...register("location")} />
            </div>
            <div>
              <Label htmlFor="target_audience">Público-alvo</Label>
              <Input id="target_audience" {...register("target_audience")} />
            </div>
            <div>
              <Label htmlFor="responsible_user_id">Responsável</Label>
              <Select id="responsible_user_id" {...register("responsible_user_id")}>
                <option value="">—</option>
                {responsibles.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select id="status" {...register("status")}>
                {EVENT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </div>

          <Button type="submit" isLoading={isPending}>
            {mode === "create" ? "Criar evento" : "Salvar evento"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
