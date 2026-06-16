"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Upload, Trash2, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atSettingsSchema, type AtSettingsInput } from "@/lib/aula-teste/schemas";
import { updateAtSettingsAction, updateAtLogoAction } from "@/app/actions/aula-teste";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export function SettingsForm({
  defaultValues,
  logoUrl,
}: {
  defaultValues: AtSettingsInput;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<AtSettingsInput>({
    resolver: zodResolver(atSettingsSchema),
    defaultValues,
  });

  function onSubmit(values: AtSettingsInput) {
    setMsg(null);
    startTransition(async () => {
      const r = await updateAtSettingsAction(values);
      setMsg(r.error ? { tone: "error", text: r.error } : { tone: "success", text: "Configurações salvas." });
      if (!r.error) router.refresh();
    });
  }

  async function uploadLogo(file: File) {
    setMsg(null);
    setLogoBusy(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `settings/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("aula-teste").upload(path, file, { upsert: true });
    setLogoBusy(false);
    if (error) return setMsg({ tone: "error", text: "Falha no upload do logotipo." });
    startTransition(async () => {
      const r = await updateAtLogoAction(path);
      if (r.error) setMsg({ tone: "error", text: r.error });
      else { setMsg({ tone: "success", text: "Logotipo atualizado." }); router.refresh(); }
    });
  }

  function removeLogo() {
    startTransition(async () => {
      const r = await updateAtLogoAction(null);
      if (!r.error) router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logotipo" width={80} height={80} className="h-full w-full object-contain" unoptimized />
          ) : (
            <Building2 className="h-8 w-8 text-slate-300" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Logotipo da instituição</Label>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" /> {logoBusy ? "Enviando…" : "Enviar logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadLogo(f); }}
              />
            </label>
            {logoUrl && (
              <Button type="button" variant="ghost" onClick={removeLogo}>
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="institution_name">Nome da instituição *</Label>
          <Input id="institution_name" hasError={!!errors.institution_name} {...register("institution_name")} />
          {errors.institution_name && <p className="mt-1 text-xs text-red-600">{errors.institution_name.message}</p>}
        </div>
        <div>
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input id="cnpj" {...register("cnpj")} />
        </div>
        <div>
          <Label htmlFor="sector">Setor responsável</Label>
          <Input id="sector" {...register("sector")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" {...register("address")} />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" hasError={!!errors.email} {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <Button type="submit" isLoading={isPending}>Salvar configurações</Button>
    </form>
  );
}
