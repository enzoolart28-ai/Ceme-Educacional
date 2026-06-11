"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recoverSchema, type RecoverInput } from "@/lib/auth/schemas";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export function RecoverForm() {
  const [message, setMessage] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverInput>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: RecoverInput) {
    setMessage(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(values);
      if (result.error) {
        setMessage({ tone: "error", text: result.error });
      } else {
        setMessage({
          tone: "success",
          text: "Se o e-mail existir, enviamos um link para redefinir a senha.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@escola.com"
          hasError={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Enviar link de recuperação
      </Button>

      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
