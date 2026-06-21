"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/auth/schemas";
import { signInAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await signInAction(values, redirectTo);
      // Em caso de sucesso a action redireciona; só chegamos aqui se houver erro.
      if (result?.error) {
        setServerError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}

      <div>
        <Label htmlFor="identifier">E-mail ou CPF do aluno</Label>
        <Input
          id="identifier"
          type="text"
          autoComplete="username"
          placeholder="voce@escola.com ou CPF"
          hasError={!!errors.identifier}
          {...register("identifier")}
        />
        {errors.identifier && (
          <p className="mt-1 text-xs text-red-600">{errors.identifier.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          hasError={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Entrar
      </Button>
    </form>
  );
}
