"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignSchema, type CampaignInput } from "@/lib/campaigns/schemas";
import { createCampaignAction, updateCampaignAction } from "@/app/actions/campaigns";
import { CAMPAIGN_STATUS_OPTIONS } from "@/lib/campaigns/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const ta = "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function CampaignForm({
  mode,
  campaignId,
  defaultValues,
}: {
  mode: "create" | "edit";
  campaignId?: string;
  defaultValues: CampaignInput;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema),
    defaultValues,
  });

  function onSubmit(values: CampaignInput) {
    setMsg(null);
    startTransition(async () => {
      const r = mode === "create" ? await createCampaignAction(values) : await updateCampaignAction(campaignId!, values);
      if (r?.error) setMsg(r.error);
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
            <textarea id="description" rows={2} className={ta} {...register("description")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="start_date">Início</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
            </div>
            <div>
              <Label htmlFor="end_date">Término</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select id="status" {...register("status")}>
                {CAMPAIGN_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="target_audience">Público-alvo</Label>
            <Input id="target_audience" {...register("target_audience")} />
          </div>
          <div>
            <Label htmlFor="rules">Regras</Label>
            <textarea id="rules" rows={2} className={ta} {...register("rules")} />
          </div>
          <div>
            <Label htmlFor="prizes">Prêmios</Label>
            <textarea id="prizes" rows={2} className={ta} {...register("prizes")} />
          </div>
          <Button type="submit" isLoading={isPending}>
            {mode === "create" ? "Criar campanha" : "Salvar campanha"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
