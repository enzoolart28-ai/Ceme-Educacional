"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/auth/schemas";
import { updateProfileAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: { full_name: string; phone: string };
}) {
  const [message, setMessage] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  function onSubmit(values: UpdateProfileInput) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result.error) {
        setMessage({ tone: "error", text: result.error });
      } else {
        setMessage({ tone: "success", text: "Perfil atualizado com sucesso." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <div>
        <Label htmlFor="full_name">Nome completo</Label>
        <Input
          id="full_name"
          hasError={!!errors.full_name}
          {...register("full_name")}
        />
        {errors.full_name && (
          <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          placeholder="(00) 00000-0000"
          hasError={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
        )}
      </div>

      <Button type="submit" isLoading={isPending}>
        Salvar alterações
      </Button>
    </form>
  );
}
