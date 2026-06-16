"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, Loader2, AlertCircle } from "lucide-react";
import { AT_WIZARD_TOTAL } from "@/lib/aula-teste/labels";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
type SaveResult = { error?: string } | void;

/** Autosave com debounce + flush imediato (usado ao navegar entre etapas). */
export function useAutosave<T>(values: T, save: (v: T) => Promise<SaveResult>) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const valuesRef = useRef(values);
  const saveRef = useRef(save);
  const firstRef = useRef(true);
  const serial = JSON.stringify(values);

  // Mantém as refs atualizadas em efeito (não durante o render).
  useEffect(() => {
    valuesRef.current = values;
    saveRef.current = save;
  });

  const run = useCallback(async () => {
    setStatus("saving");
    const r = await saveRef.current(valuesRef.current);
    const err = r && typeof r === "object" && "error" in r ? r.error : undefined;
    setStatus(err ? "error" : "saved");
  }, []);

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    const t = setTimeout(() => void run(), 1000);
    return () => clearTimeout(t);
  }, [serial, run]);

  return { status, flush: run };
}

export function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === "saving")
    return <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" /> Salvando…</span>;
  if (status === "saved")
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3 w-3" /> Salvo</span>;
  if (status === "error")
    return <span className="inline-flex items-center gap-1 text-xs text-rose-600"><AlertCircle className="h-3 w-3" /> Erro ao salvar</span>;
  return <span className="text-xs text-slate-300">Salvamento automático</span>;
}

export function WizardCard({
  title,
  step,
  status,
  children,
}: {
  title: string;
  step: number;
  status: SaveStatus;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-400">Etapa {step} de {AT_WIZARD_TOTAL}</p>
          </div>
          <SaveStatusBadge status={status} />
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function StepNav({
  reportId,
  step,
  flush,
}: {
  reportId: string;
  step: number;
  flush: () => Promise<void>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go(target: number) {
    if (target < 1 || target > AT_WIZARD_TOTAL) return;
    setBusy(true);
    await flush();
    router.push(`/dashboard/aula-teste/${reportId}/editar?step=${target}`);
  }

  return (
    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
      <Button variant="outline" disabled={step <= 1 || busy} onClick={() => go(step - 1)}>
        <ChevronLeft className="h-4 w-4" /> Anterior
      </Button>
      <Button disabled={step >= AT_WIZARD_TOTAL || busy} onClick={() => go(step + 1)}>
        Próximo <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
