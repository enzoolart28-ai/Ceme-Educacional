"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Wand2 } from "lucide-react";
import { createUserSchema, type CreateUserInput } from "@/lib/users/schemas";
import { createUserAction } from "@/app/actions/users";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#!";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function UserCreateForm() {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { full_name: "", email: "", password: "", role: "professor" },
  });

  function onSubmit(values: CreateUserInput) {
    setMsg(null);
    startTransition(async () => {
      const r = await createUserAction(values);
      if (r.error) setMsg({ tone: "error", text: r.error });
      else {
        setMsg({ tone: "success", text: `Usuário ${values.email} criado.` });
        reset({ full_name: "", email: "", password: "", role: values.role });
        router.refresh();
      }
    });
  }

  return (
    <Card className="mb-6">
      <CardContent>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <UserPlus className="h-4 w-4 text-indigo-500" /> Criar novo usuário
        </h2>
        {msg && <Alert tone={msg.tone} className="mb-3">{msg.text}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input id="full_name" hasError={!!errors.full_name} {...register("full_name")} />
            {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">E-mail (login) *</Label>
            <Input id="email" hasError={!!errors.email} {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="role">Perfil *</Label>
            <Select id="role" {...register("role")}>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="password">Senha *</Label>
            <div className="flex items-center gap-2">
              <Input id="password" hasError={!!errors.password} {...register("password")} />
              <Button type="button" variant="outline" onClick={() => setValue("password", randomPassword(), { shouldValidate: true })} title="Gerar senha">
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            <p className="mt-1 text-xs text-slate-400">Anote a senha — ela não é exibida depois.</p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" isLoading={isPending}><UserPlus className="h-4 w-4" /> Criar usuário</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
