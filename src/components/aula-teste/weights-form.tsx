"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAtWeightsAction } from "@/app/actions/aula-teste";
import { AT_WEIGHT_SECTIONS, AT_WEIGHT_SECTION_LABELS, type AtWeightSection } from "@/lib/aula-teste/labels";
import type { AtWeightsInput } from "@/lib/aula-teste/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function WeightsForm({ defaultWeights }: { defaultWeights: Record<AtWeightSection, number> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<AtWeightSection, string>>(
    Object.fromEntries(AT_WEIGHT_SECTIONS.map((s) => [s, String(defaultWeights[s] ?? 0)])) as Record<AtWeightSection, string>,
  );
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = AT_WEIGHT_SECTIONS.reduce((sum, s) => sum + (Number(values[s]) || 0), 0);

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await updateAtWeightsAction(values as AtWeightsInput);
      setMsg(r.error ? { tone: "error", text: r.error } : { tone: "success", text: "Pesos salvos." });
      if (!r.error) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {AT_WEIGHT_SECTIONS.map((s) => (
          <div key={s} className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-700">{AT_WEIGHT_SECTION_LABELS[s]}</span>
            <div className="flex items-center gap-1">
              <Input
                inputMode="numeric"
                value={values[s]}
                onChange={(e) => setValues((p) => ({ ...p, [s]: e.target.value.replace(/[^\d]/g, "") }))}
                className="w-20 text-right"
              />
              <span className="text-sm text-slate-400">%</span>
            </div>
          </div>
        ))}
      </div>
      <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${total === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
        <span>Soma dos pesos</span>
        <span className="font-semibold">{total}%</span>
      </div>
      {total !== 100 && (
        <p className="text-xs text-slate-500">
          A soma não precisa ser exatamente 100% — o sistema normaliza os pesos no cálculo. Recomenda-se 100% para leitura mais direta.
        </p>
      )}
      <Button onClick={save} isLoading={isPending}>Salvar pesos</Button>
    </div>
  );
}
