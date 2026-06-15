"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { generateAlertsAction } from "@/app/actions/alerts";
import { Button } from "@/components/ui/button";

export function GenerateAlertsButton() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    setMsg(null);
    startTransition(async () => {
      const r = await generateAlertsAction();
      setMsg(r.error ?? `${r.created ?? 0} novo(s) alerta(s) gerado(s).`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
      <Button onClick={run} isLoading={isPending}>
        <RefreshCw className="h-4 w-4" /> Gerar alertas
      </Button>
    </div>
  );
}
