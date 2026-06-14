"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { registrationSchema, type RegistrationInput } from "@/lib/events/schemas";
import { registerForEventAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function RegistrationForm({ eventId }: { eventId: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      event_id: eventId,
      full_name: "", phone: "", email: "", age: "",
      guardian_name: "", course_interest: "", city: "", school: "", notes: "",
    },
  });

  function onSubmit(values: RegistrationInput) {
    setError(null);
    startTransition(async () => {
      const result = await registerForEventAction(values);
      if (result?.error) setError(result.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 className="mt-3 text-lg font-semibold text-emerald-900">Inscrição confirmada! 🎉</h2>
        <p className="mt-1 text-sm text-emerald-800">Obrigado por se inscrever. Em breve entraremos em contato.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <input type="hidden" {...register("event_id")} />
      {error && <Alert tone="error">{error}</Alert>}

      <div>
        <Label htmlFor="full_name">Nome completo *</Label>
        <Input id="full_name" hasError={!!errors.full_name} {...register("full_name")} />
        {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="age">Idade</Label>
          <Input id="age" inputMode="numeric" {...register("age")} />
        </div>
        <div>
          <Label htmlFor="guardian_name">Nome do responsável</Label>
          <Input id="guardian_name" {...register("guardian_name")} />
        </div>
        <div>
          <Label htmlFor="course_interest">Curso de interesse</Label>
          <Input id="course_interest" {...register("course_interest")} />
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" {...register("city")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="school">Escola</Label>
          <Input id="school" {...register("school")} />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Observação</Label>
        <textarea id="notes" rows={2} className={textareaClass} {...register("notes")} />
      </div>

      <Button type="submit" isLoading={isPending} className="w-full">Confirmar inscrição</Button>
    </form>
  );
}
